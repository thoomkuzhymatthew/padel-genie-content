create table public.reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80)
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  run_id text not null, source_url text not null, source_title text not null,
  format text not null, template text not null, story text not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  caption text not null check (char_length(caption) <= 4000),
  asset_paths text[] not null default '{}', trace jsonb not null,
  playbook_version text not null,
  status text not null default 'proposed' check (status in ('proposed','approved','posted','rejected')),
  version integer not null default 1,
  content_version integer not null default 1,
  rendered_version integer not null default 1,
  render_stale boolean generated always as (content_version <> rendered_version) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.post_events (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id),
  actor_id uuid not null references public.reviewers(user_id),
  type text not null check (type in ('approve','edit','reject','posted')),
  before jsonb not null, after jsonb not null, diff jsonb not null default '[]',
  note text, reason text, reason_tags text[] not null default '{}', created_at timestamptz not null default now()
);
create index posts_status_created_idx on public.posts(status, created_at desc);
create index events_post_created_idx on public.post_events(post_id, created_at desc);
alter table public.posts enable row level security;
alter table public.post_events enable row level security;
alter table public.reviewers enable row level security;

create function public.is_reviewer() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.reviewers where user_id = auth.uid());
$$;
revoke all on function public.is_reviewer() from public, anon;
grant execute on function public.is_reviewer() to authenticated;
create policy reviewer_posts on public.posts for select to authenticated using ((select public.is_reviewer()));
create policy reviewer_events on public.post_events for select to authenticated using ((select public.is_reviewer()));
create policy reviewer_names on public.reviewers for select to authenticated using ((select public.is_reviewer()));
revoke all on public.posts, public.post_events, public.reviewers from public, anon, authenticated;
grant select on public.posts, public.post_events, public.reviewers to authenticated;
grant all on public.posts, public.post_events, public.reviewers to service_role;

create function public.json_diff(a jsonb, b jsonb, path text default '') returns jsonb
language plpgsql immutable set search_path = '' as $$
declare k text; i integer; result jsonb := '[]';
begin
 if a is not distinct from b then return result; end if;
 if jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then
  for k in select key from jsonb_object_keys(a) key union select key from jsonb_object_keys(b) key loop
   result := result || public.json_diff(a->k,b->k,case when path='' then k else path||'.'||k end);
  end loop;
 elsif jsonb_typeof(a)='array' and jsonb_typeof(b)='array' then
  for i in 0..greatest(jsonb_array_length(a),jsonb_array_length(b))-1 loop
   result := result || public.json_diff(a->i,b->i,path||'.'||i::text);
  end loop;
 else result := jsonb_build_array(jsonb_build_object('path',path,'before',a,'after',b));
 end if;
 return result;
end;
$$;
revoke all on function public.json_diff(jsonb,jsonb,text) from public, anon, authenticated;

create function public.review_post(
 p_post_id uuid, p_action text, p_expected_version integer,
 p_caption text default null, p_content jsonb default null,
 p_note text default null, p_reason text default null, p_reason_tags text[] default '{}'
) returns public.posts language plpgsql security definer set search_path = '' as $$
declare old public.posts; fresh public.posts; before_data jsonb; after_data jsonb;
 allowed_numbers jsonb; token text[]; numeric_value numeric;
begin
 if not public.is_reviewer() then raise exception 'Reviewer access required' using errcode='42501'; end if;
 select * into old from public.posts where id=p_post_id for update;
 if not found then raise exception 'Post not found'; end if;
 if old.version <> p_expected_version then raise exception 'This post changed. Refresh and try again.' using errcode='40001'; end if;
 if p_action not in ('approve','edit','reject','posted') then raise exception 'Invalid action'; end if;
 if char_length(coalesce(p_note,'')) > 2000 or char_length(coalesce(p_reason,''))>2000 then raise exception 'Note is too long'; end if;
 if p_action='approve' and (old.status<>'proposed' or old.render_stale) then raise exception 'Only a current proposed draft can be approved'; end if;
 if p_action='posted' and (old.status<>'approved' or old.render_stale) then raise exception 'Only a current approved draft can be marked posted'; end if;
 if p_action='reject' and old.status not in ('proposed','approved') then raise exception 'This post cannot be rejected'; end if;
 if p_action='reject' and cardinality(coalesce(p_reason_tags,'{}'))=0 and btrim(coalesce(p_reason,''))='' then raise exception 'Give a rejection reason'; end if;
 if not coalesce(p_reason_tags,'{}') <@ array['Too dense','Not interesting','Off brand','Wrong angle','Needs verification']::text[] then raise exception 'Invalid reason tag'; end if;
 if p_action='edit' then
  if old.status='posted' then raise exception 'Posted content is read only'; end if;
  if p_caption is null or char_length(p_caption)>4000 or p_content is null or jsonb_typeof(p_content)<>'object' then raise exception 'Invalid draft content'; end if;
  if p_content->>'source_line' is distinct from old.content->>'source_line' or p_content->>'wordmark' is distinct from old.content->>'wordmark' then raise exception 'Source and brand fields are fixed'; end if;
  allowed_numbers := old.trace->'verified_numbers';
  for token in select regexp_matches(p_caption||' '||p_content::text, '(?<![[:alnum:]_.,])[-+−]?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?(?:st|nd|rd|th)?(?![[:alnum:]_]|[,.][0-9])', 'g') loop
   numeric_value := replace(replace(regexp_replace(token[1],'(st|nd|rd|th)$',''),',',''),'−','-')::numeric;
   if not exists(select 1 from jsonb_array_elements_text(allowed_numbers) number where number::numeric=numeric_value) then raise exception 'A number is not supported by this draft’s verified evidence'; end if;
  end loop;
 end if;
 before_data := jsonb_build_object('status',old.status,'caption',old.caption,'content',old.content);
 update public.posts set
   status=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'posted' then 'posted' else 'proposed' end,
   caption=case when p_action='edit' then p_caption else caption end,
   content=case when p_action='edit' then p_content else content end,
   content_version=content_version+case when p_action='edit' and p_content is distinct from old.content then 1 else 0 end,
   version=version+1, updated_at=now()
 where id=p_post_id returning * into fresh;
 after_data := jsonb_build_object('status',fresh.status,'caption',fresh.caption,'content',fresh.content);
 insert into public.post_events(post_id,actor_id,type,before,after,diff,note,reason,reason_tags)
 values(p_post_id,auth.uid(),p_action,before_data,after_data,public.json_diff(before_data,after_data),nullif(btrim(p_note),''),nullif(btrim(p_reason),''),coalesce(p_reason_tags,'{}'));
 return fresh;
end;
$$;
revoke all on function public.review_post(uuid,text,integer,text,jsonb,text,text,text[]) from public, anon;
grant execute on function public.review_post(uuid,text,integer,text,jsonb,text,text,text[]) to authenticated;

create function public.complete_post_render(p_post_id uuid,p_content_version integer,p_assets text[],p_render_trace jsonb)
returns public.posts language plpgsql security definer set search_path = '' as $$
declare fresh public.posts;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Pipeline access required' using errcode='42501'; end if;
 if cardinality(p_assets)=0 or exists(select 1 from unnest(p_assets) asset where asset not like '/outputs/%' or asset like '%..%') then raise exception 'Invalid asset paths'; end if;
 update public.posts set asset_paths=p_assets,rendered_version=p_content_version,version=version+1,updated_at=now(),
 trace=jsonb_set(trace,'{latest_render}',p_render_trace,true)
 where id=p_post_id and content_version=p_content_version returning * into fresh;
 if not found then raise exception 'Content changed during rendering. Render the latest version.' using errcode='40001'; end if;
 return fresh;
end;
$$;
revoke all on function public.complete_post_render(uuid,integer,text[],jsonb) from public, anon, authenticated;
grant execute on function public.complete_post_render(uuid,integer,text[],jsonb) to service_role;

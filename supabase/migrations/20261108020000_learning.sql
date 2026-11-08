create table public.feedback_findings (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.post_events(id),
 post_id uuid not null references public.posts(id), category text not null check(category in ('post-specific','template/layout','recurring editorial','data/fact')),
 evidence text not null, rationale text not null, status text not null default 'pending', resolution text,
 unique(event_id,category)
);
create table public.atom_reviews(id uuid primary key default gen_random_uuid(), finding_id uuid unique references public.feedback_findings(id),post_id uuid references public.posts(id),atom_ids text[] not null,status text not null default 'open');
create table public.learning_runs(
 id uuid primary key default gen_random_uuid(), requested_by uuid references public.reviewers(user_id), status text not null default 'queued' check(status in ('queued','running','done','failed')),
 stage text not null default 'Queued',report text,diff text,pr_url text,replays jsonb not null default '[]',evidence jsonb,model_trace jsonb,workflow_url text,error text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index one_active_learning_run on public.learning_runs((true)) where status in ('queued','running');
create table public.post_metrics(post_id uuid references public.posts(id),date date not null,platform text not null,impressions integer not null,likes integer not null,comments integer not null,shares integer not null,saves integer not null,clicks integer not null,is_mock boolean not null default true,primary key(post_id,date,platform));
create table public.notification_recipients(id uuid primary key default gen_random_uuid(),email text not null unique check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),notify_new_drafts boolean not null default true,notify_learning_report boolean not null default true,notify_replay_ready boolean not null default true,added_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now());
create table public.notification_deliveries(id uuid primary key default gen_random_uuid(),dedupe_key text unique not null,type text not null,recipient_id uuid references public.notification_recipients(id) on delete set null,status text not null,response_id text,error text,created_at timestamptz not null default now());
-- Every piece of feedback is visible immediately; worker refines and splits classifications with an evidence trail.
create function public.triage_feedback() returns trigger language plpgsql security definer set search_path='' as $$
declare evidence text; category text;
begin
 if new.type not in ('edit','reject') then return new;end if;
 evidence:=concat_ws(' ',nullif(new.note,''),nullif(new.reason,''),array_to_string(new.reason_tags,', '));
 if btrim(evidence)='' then evidence:='Text edit: '||new.diff::text;end if;
 category:=case when evidence ~* '(divider|overlap|intersect|padding|spacing|layout|font|margin|too dense)' then 'template/layout'
 when evidence ~* '(incorrect|wrong number|wrong fact|source|verify|verification|inaccurate)' then 'data/fact'
 when evidence ~* '(always|never|every post|in future|generally|less hype|British|punchier|hold.back)' then 'recurring editorial' else 'post-specific' end;
 insert into public.feedback_findings(event_id,post_id,category,evidence,rationale) values(new.id,new.post_id,category,evidence,'Initial routing; learning job reviews the note and edit diff.');
 return new;
end;$$;
create trigger classify_feedback after insert on public.post_events for each row execute function public.triage_feedback();
create function public.guard_fact_review() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status in ('approved','posted') and exists(select 1 from public.atom_reviews where post_id=new.id and status='open') then raise exception 'An atom needs factual review before approval';end if;return new;end;$$;
create trigger fact_review_gate before update on public.posts for each row execute function public.guard_fact_review();
create function public.request_learning() returns public.learning_runs language plpgsql security definer set search_path='' as $$declare job public.learning_runs;begin
 if not public.is_reviewer() then raise exception 'Reviewer access required' using errcode='42501';end if;
 select * into job from public.learning_runs where status in ('queued','running');if found then return job;end if;
 insert into public.learning_runs(requested_by) values(auth.uid()) returning * into job;return job;
 exception when unique_violation then select * into job from public.learning_runs where status in ('queued','running');return job;
end;$$;
create function public.fail_learning_dispatch(p_id uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.is_reviewer() then raise exception 'Reviewer access required' using errcode='42501';end if;
 update public.learning_runs set status='failed',stage='Dispatch failed',error='GitHub dispatch failed. Try again.',updated_at=now() where id=p_id and requested_by=auth.uid() and status='queued';end;$$;
revoke all on function public.request_learning(),public.fail_learning_dispatch(uuid) from public,anon;
grant execute on function public.request_learning(),public.fail_learning_dispatch(uuid) to authenticated;
do $$declare t text;begin
 foreach t in array array['feedback_findings','atom_reviews','learning_runs','post_metrics','notification_recipients','notification_deliveries'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy reviewer_read on public.%I for select to authenticated using(public.is_reviewer())',t);
 end loop;end;$$;
grant insert,update,delete on public.notification_recipients to authenticated;
create policy reviewer_manage on public.notification_recipients for all to authenticated using(public.is_reviewer()) with check(public.is_reviewer());
-- Backfill without altering the original human events.
insert into public.feedback_findings(event_id,post_id,category,evidence,rationale)
select id,post_id,case when concat_ws(' ',note,reason) ~* '(divider|overlap|intersect|padding|spacing|layout)' then 'template/layout' else 'post-specific' end,concat_ws(' ',note,reason,array_to_string(reason_tags,', ')),'Backfilled original feedback; pending evidence-based triage.' from public.post_events where type in ('edit','reject');

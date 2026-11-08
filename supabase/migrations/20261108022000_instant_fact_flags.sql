create or replace function public.triage_feedback() returns trigger language plpgsql security definer set search_path='' as $$
declare evidence text; category text; finding uuid;
begin
 if new.type not in ('edit','reject') then return new;end if;
 evidence:=concat_ws(' ',nullif(new.note,''),nullif(new.reason,''),array_to_string(new.reason_tags,', '));
 if btrim(evidence)='' then evidence:='Text edit: '||new.diff::text;end if;
 category:=case when evidence ~* '(divider|overlap|intersect|padding|spacing|layout|font|margin|too dense)' then 'template/layout'
 when evidence ~* '(incorrect|wrong number|wrong fact|source|verify|verification|inaccurate)' then 'data/fact'
 when evidence ~* '(always|never|every post|in future|generally|less hype|British|punchier|hold.back)' then 'recurring editorial' else 'post-specific' end;
 insert into public.feedback_findings(event_id,post_id,category,evidence,rationale) values(new.id,new.post_id,category,evidence,'Initial routing; learning job reviews the note and edit diff.') returning id into finding;
 if category='data/fact' then
 insert into public.atom_reviews(finding_id,post_id,atom_ids) select finding,new.post_id,array(select a->>'id' from jsonb_array_elements(trace->'atoms') a) from public.posts where id=new.post_id;
 end if;
 return new;
end;$$;

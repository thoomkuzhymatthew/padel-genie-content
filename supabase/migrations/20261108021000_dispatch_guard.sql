create function public.claim_learning_dispatch(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$declare claimed uuid;begin
 if not public.is_reviewer() then raise exception 'Reviewer access required' using errcode='42501';end if;
 update public.learning_runs set stage='Dispatching workflow',updated_at=now() where id=p_id and requested_by=auth.uid() and status='queued' and stage='Queued' returning id into claimed;return claimed is not null;
end;$$;
revoke all on function public.claim_learning_dispatch(uuid) from public,anon;
grant execute on function public.claim_learning_dispatch(uuid) to authenticated;

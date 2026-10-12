-- Run in the intended Supabase project's SQL editor. Does not alter legacy tables.
begin;
create table if not exists public.fortis_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null check (length(record_id) between 1 and 200),
  value jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, record_id)
);
alter table public.fortis_records enable row level security;
revoke all on public.fortis_records from anon;
grant select, insert, update on public.fortis_records to authenticated;
drop policy if exists fortis_owner_select on public.fortis_records;
create policy fortis_owner_select on public.fortis_records for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists fortis_owner_insert on public.fortis_records;
create policy fortis_owner_insert on public.fortis_records for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists fortis_owner_update on public.fortis_records;
create policy fortis_owner_update on public.fortis_records for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Compare-and-swap prevents a stale device from silently overwriting newer data.
-- SECURITY INVOKER deliberately preserves ownership policies, including RPC calls.
create or replace function public.fortis_put_record(
  p_record_id text, p_value jsonb, p_expected_revision bigint
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_row public.fortis_records%rowtype;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_expected_revision < 0 or p_expected_revision is null or p_value is null then
    raise exception 'Invalid revision or value';
  end if;
  -- Also serializes two devices trying to create the same previously absent row.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || ':' || p_record_id, 0));
  select * into current_row from public.fortis_records
    where user_id = owner_id and record_id = p_record_id for update;
  if not found then
    if p_expected_revision <> 0 then
      return jsonb_build_object('ok', false, 'value', null, 'revision', 0);
    end if;
    insert into public.fortis_records(user_id,record_id,value)
      values(owner_id,p_record_id,p_value) returning * into current_row;
  elsif current_row.revision <> p_expected_revision then
    return jsonb_build_object('ok',false,'value',current_row.value,'revision',current_row.revision);
  else
    update public.fortis_records set value = p_value, revision = revision + 1, updated_at = now()
      where user_id = owner_id and record_id = p_record_id returning * into current_row;
  end if;
  return jsonb_build_object('ok',true,'revision',current_row.revision);
end;
$$;
revoke all on function public.fortis_put_record(text,jsonb,bigint) from public, anon;
grant execute on function public.fortis_put_record(text,jsonb,bigint) to authenticated;
commit;

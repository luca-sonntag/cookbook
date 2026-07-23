-- Core schema for the `jobs` table + queue RPC.
--
-- Reconstructed from backend/src/db.ts (JobRow + the createJob/updateJob/claim
-- queries) and backend/src/types.ts, because the historical `jobs` DDL was
-- created manually in the hosted Supabase and never lived in the repo. Apply
-- this FIRST, then backend/supabase_schema.sql (which ALTERs jobs to add
-- is_favorite/flags/media_bytes and creates collections/recipe_collections/
-- feedback/global_settings/buckets/indexes — all idempotent).
--
-- Safe to re-run (IF NOT EXISTS / OR REPLACE). Policies are dropped-and-recreated
-- so a second run does not error on duplicates.

create table if not exists public.jobs (
  id             text primary key,
  url            text not null,
  url_normalized text,
  status         text not null default 'pending',
  error          text,
  recipe         jsonb,
  user_id        uuid not null references auth.users(id) on delete cascade,
  parent_job_id  text references public.jobs(id) on delete set null,
  prompt         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  locked_at      timestamptz,
  locked_by      text
);

create index if not exists jobs_user_id_idx        on public.jobs(user_id);
create index if not exists jobs_status_idx         on public.jobs(status);
create index if not exists jobs_created_at_idx     on public.jobs(created_at desc);
create index if not exists jobs_url_normalized_idx on public.jobs(url_normalized);

-- RLS: users only see their own jobs. The backend uses the service-role key,
-- which bypasses RLS; these policies are defense-in-depth for any direct
-- authenticated client access.
alter table public.jobs enable row level security;

drop policy if exists jobs_select_own on public.jobs;
drop policy if exists jobs_insert_own on public.jobs;
drop policy if exists jobs_update_own on public.jobs;
drop policy if exists jobs_delete_own on public.jobs;

create policy jobs_select_own on public.jobs
  for select to authenticated using (auth.uid() = user_id);
create policy jobs_insert_own on public.jobs
  for insert to authenticated with check (auth.uid() = user_id);
create policy jobs_update_own on public.jobs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy jobs_delete_own on public.jobs
  for delete to authenticated using (auth.uid() = user_id);

-- Atomically claim the oldest pending job for a worker (matches claimNextJob /
-- reclaimExpiredJobs semantics in db.ts: sets a non-terminal status + lease).
create or replace function public.claim_next_job(worker_id text)
returns setof public.jobs
language plpgsql
security definer
as $$
begin
  return query
  update public.jobs j
     set status     = 'scraping',
         locked_by  = worker_id,
         locked_at  = now(),
         updated_at = now()
   where j.id = (
     select id from public.jobs
      where status = 'pending'
      order by created_at asc
      for update skip locked
      limit 1
   )
  returning j.*;
end;
$$;

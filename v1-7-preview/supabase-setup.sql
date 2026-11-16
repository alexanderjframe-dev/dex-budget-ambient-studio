-- Dex Budget v1.7 — private per-user financial backups.
-- Run this in the SQL editor of your Supabase PROJECT, not on GitHub.
-- NEVER use a service-role or secret key in static frontend files.

create table if not exists public.dex_budget_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check(revision > 0),
  updated_at timestamptz not null default now(),
  constraint dex_budget_snapshots_payload_object check(jsonb_typeof(payload) = 'object')
);

alter table public.dex_budget_snapshots enable row level security;
revoke all on public.dex_budget_snapshots from anon;
grant select, insert, update on public.dex_budget_snapshots to authenticated;

drop policy if exists dex_select_own_snapshot on public.dex_budget_snapshots;
create policy dex_select_own_snapshot
  on public.dex_budget_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists dex_insert_own_snapshot on public.dex_budget_snapshots;
create policy dex_insert_own_snapshot
  on public.dex_budget_snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists dex_update_own_snapshot on public.dex_budget_snapshots;
create policy dex_update_own_snapshot
  on public.dex_budget_snapshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No anonymous-read or cross-user policy. There is no public analytics table.
-- IMPORTANT: This is private access through RLS, NOT end-to-end encryption.

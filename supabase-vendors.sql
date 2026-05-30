-- OrdainedPro officiant vendor directory
-- Run this in the Supabase SQL editor before using My Vendors in production.

create table if not exists public.officiant_vendors (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_type text not null default 'Other',
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists officiant_vendors_user_id_idx
  on public.officiant_vendors(user_id);

create index if not exists officiant_vendors_user_type_idx
  on public.officiant_vendors(user_id, business_type);

alter table public.officiant_vendors enable row level security;

drop policy if exists "Officiants can read their vendors" on public.officiant_vendors;
create policy "Officiants can read their vendors"
  on public.officiant_vendors
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Officiants can add their vendors" on public.officiant_vendors;
create policy "Officiants can add their vendors"
  on public.officiant_vendors
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Officiants can update their vendors" on public.officiant_vendors;
create policy "Officiants can update their vendors"
  on public.officiant_vendors
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Officiants can delete their vendors" on public.officiant_vendors;
create policy "Officiants can delete their vendors"
  on public.officiant_vendors
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.officiant_vendors to authenticated;
grant usage, select on sequence public.officiant_vendors_id_seq to authenticated;
grant select, insert, update, delete on table public.officiant_vendors to service_role;
grant usage, select on sequence public.officiant_vendors_id_seq to service_role;

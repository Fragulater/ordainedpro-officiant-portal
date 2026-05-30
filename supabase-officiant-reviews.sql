-- OrdainedPro officiant review system
-- Run this in the Supabase SQL Editor before using the public review form.

create extension if not exists "uuid-ossp";

create table if not exists public.officiant_reviews (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete cascade,
  officiant_user_id uuid not null references auth.users(id) on delete cascade,
  couple_id integer references public.couples(id) on delete set null,
  reviewer_name text,
  reviewer_email text,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_officiant_reviews_officiant_user_id
  on public.officiant_reviews(officiant_user_id);

create index if not exists idx_officiant_reviews_profile_id
  on public.officiant_reviews(profile_id);

create index if not exists idx_officiant_reviews_status_created_at
  on public.officiant_reviews(status, created_at desc);

alter table public.officiant_reviews enable row level security;

drop policy if exists "Published officiant reviews are public" on public.officiant_reviews;
create policy "Published officiant reviews are public"
  on public.officiant_reviews
  for select
  using (status = 'published');

drop policy if exists "Officiants can view their own reviews" on public.officiant_reviews;
create policy "Officiants can view their own reviews"
  on public.officiant_reviews
  for select
  to authenticated
  using (auth.uid() = officiant_user_id);

grant select on public.officiant_reviews to anon;
grant select on public.officiant_reviews to authenticated;
grant select, insert, update, delete on table public.officiant_reviews to service_role;

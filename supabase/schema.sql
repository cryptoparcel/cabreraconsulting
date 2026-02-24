-- ═══════════════════════════════════════════════════
-- Cabrera Portal — Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════

-- PROFILES (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  role text not null default 'Client',
  initials text not null default '',
  company text default 'Cabrera Consulting',
  phone text default '',
  bio text default '',
  timezone text default 'America/Los_Angeles',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- INVENTORY
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sku text default '',
  qty integer default 0,
  reorder integer default 0,
  price numeric(10,2) default 0,
  cost numeric(10,2) default 0,
  category text default 'General',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.inventory enable row level security;
create policy "inventory_select" on public.inventory for select using (auth.uid() = user_id);
create policy "inventory_insert" on public.inventory for insert with check (auth.uid() = user_id);
create policy "inventory_update" on public.inventory for update using (auth.uid() = user_id);
create policy "inventory_delete" on public.inventory for delete using (auth.uid() = user_id);

-- BILLING
create table if not exists public.billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(10,2) default 0,
  prev_amount numeric(10,2) default 0,
  category text default 'General',
  due_date date,
  autopay boolean default false,
  created_at timestamptz default now()
);

alter table public.billing enable row level security;
create policy "billing_select" on public.billing for select using (auth.uid() = user_id);
create policy "billing_insert" on public.billing for insert with check (auth.uid() = user_id);
create policy "billing_update" on public.billing for update using (auth.uid() = user_id);
create policy "billing_delete" on public.billing for delete using (auth.uid() = user_id);

-- PARTNERS
create table if not exists public.partners (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text default 'Referral',
  contact text default '',
  url text default '',
  referrals integer default 0,
  created_at timestamptz default now()
);

alter table public.partners enable row level security;
create policy "partners_select" on public.partners for select using (auth.uid() = user_id);
create policy "partners_insert" on public.partners for insert with check (auth.uid() = user_id);
create policy "partners_update" on public.partners for update using (auth.uid() = user_id);
create policy "partners_delete" on public.partners for delete using (auth.uid() = user_id);

-- DOCUMENTS
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  file_size bigint default 0,
  mime_type text default 'application/octet-stream',
  folder text default 'All Files',
  created_at timestamptz default now()
);

alter table public.documents enable row level security;
create policy "documents_select" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update" on public.documents for update using (auth.uid() = user_id);
create policy "documents_delete" on public.documents for delete using (auth.uid() = user_id);

-- NOTIFICATIONS / ALERTS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  type text default 'info' check (type in ('critical','warning','info')),
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_delete" on public.notifications for delete using (auth.uid() = user_id);

-- STORAGE BUCKET for file uploads
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict do nothing;

create policy "storage_insert" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "storage_select" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "storage_delete" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- AUTO-CREATE PROFILE on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Client'),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 1) ||
          coalesce(left(split_part(coalesce(new.raw_user_meta_data->>'name', new.email), ' ', 2), 1), ''))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

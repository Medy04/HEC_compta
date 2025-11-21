-- Supabase schema and RLS policies for HEC Abidjan accounting app
-- Run this in Supabase SQL Editor on your project

-- Enable required extensions (usually enabled)
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Profiles linked to Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','accountant','viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'viewer')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function to read current role
create or replace function public.current_role()
returns text language sql stable as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'viewer');
$$;

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income','expense')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Cost centers
create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  created_at timestamptz not null default now()
);

alter table public.cost_centers enable row level security;

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  t_type text not null check (t_type in ('income','expense')),
  t_date date not null,
  amount numeric(14,2) not null,
  category_id uuid references public.categories(id) on delete restrict,
  cost_center_id uuid references public.cost_centers(id) on delete set null,
  payment_method text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

-- Attachments
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  file_name text not null,
  url text not null,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now()
);

alter table public.attachments enable row level security;

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- RLS Policies
-- Profiles
create policy if not exists profiles_self_read
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy if not exists profiles_self_update
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy if not exists profiles_admin_manage
  on public.profiles for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Categories
create policy if not exists categories_read
  on public.categories for select
  using (true);

create policy if not exists categories_write
  on public.categories for insert
  with check (public.current_role() in ('admin','accountant'));

create policy if not exists categories_update
  on public.categories for update
  using (public.current_role() in ('admin','accountant')) with check (public.current_role() in ('admin','accountant'));

create policy if not exists categories_delete
  on public.categories for delete
  using (public.current_role() = 'admin');

-- Cost centers
create policy if not exists cost_centers_read
  on public.cost_centers for select
  using (true);

create policy if not exists cost_centers_write
  on public.cost_centers for insert
  with check (public.current_role() in ('admin','accountant'));

create policy if not exists cost_centers_update
  on public.cost_centers for update
  using (public.current_role() in ('admin','accountant')) with check (public.current_role() in ('admin','accountant'));

create policy if not exists cost_centers_delete
  on public.cost_centers for delete
  using (public.current_role() = 'admin');

-- Transactions
create policy if not exists transactions_read
  on public.transactions for select
  using (true);

create policy if not exists transactions_write
  on public.transactions for insert
  with check (public.current_role() in ('admin','accountant'));

create policy if not exists transactions_update
  on public.transactions for update
  using (public.current_role() in ('admin','accountant')) with check (public.current_role() in ('admin','accountant'));

create policy if not exists transactions_delete
  on public.transactions for delete
  using (public.current_role() = 'admin');

-- Attachments
create policy if not exists attachments_read
  on public.attachments for select
  using (true);

create policy if not exists attachments_write
  on public.attachments for insert
  with check (public.current_role() in ('admin','accountant'));

create policy if not exists attachments_delete
  on public.attachments for delete
  using (public.current_role() = 'admin');

-- Audit logs
create policy if not exists audit_logs_read_admin
  on public.audit_logs for select
  using (public.current_role() = 'admin');

create policy if not exists audit_logs_insert_any
  on public.audit_logs for insert
  with check (true);

-- Optional helpful indexes
create index if not exists idx_transactions_date on public.transactions (t_date);
create index if not exists idx_transactions_category on public.transactions (category_id);
create index if not exists idx_transactions_cost_center on public.transactions (cost_center_id);

-- H) Specialties per cost center
-- Table: specialties
create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  cost_center_id uuid not null references public.cost_centers(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Add specialty_id to transactions
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'specialty_id'
  ) then
    alter table public.transactions add column specialty_id uuid references public.specialties(id) on delete set null;
    create index if not exists idx_transactions_specialty on public.transactions (specialty_id);
  end if;
end $$;

-- RLS policies for specialties
alter table public.specialties enable row level security;
drop policy if exists specialties_read_all on public.specialties;
create policy specialties_read_all on public.specialties for select using (true);

drop policy if exists specialties_insert_admin on public.specialties;
create policy specialties_insert_admin on public.specialties for insert with check (public.current_role() = 'admin');

drop policy if exists specialties_update_admin on public.specialties;
create policy specialties_update_admin on public.specialties for update using (public.current_role() = 'admin');

drop policy if exists specialties_delete_admin on public.specialties;
create policy specialties_delete_admin on public.specialties for delete using (public.current_role() = 'admin');

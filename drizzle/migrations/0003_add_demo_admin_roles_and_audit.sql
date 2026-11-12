create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create table public.skillswap_demo_admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  session_id text not null,
  action text not null,
  created_at timestamp with time zone not null default now(),
  details jsonb not null default '{}'::jsonb,
  constraint skillswap_demo_admin_audit_action_check check (action = 'early_finish_authorized')
);

grant select on public.skillswap_demo_admin_audit to authenticated;
grant all on public.skillswap_demo_admin_audit to service_role;

alter table public.skillswap_demo_admin_audit enable row level security;

create policy "Admins can read demo administration audit"
on public.skillswap_demo_admin_audit
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
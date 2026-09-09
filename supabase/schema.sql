-- Migration target for a future Supabase deployment.
-- Supabase Auth owns credentials in auth.users. Never create a public password table.
create extension if not exists pgcrypto;
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default '', surname text not null default '', university text not null default '',
  major text not null default '', course integer not null default 1 check(course between 1 and 8),
  avatar text not null default '', language text not null default 'kk' check(language in ('kk','ru','en')),
  onboarded boolean not null default false, demo_seeded boolean not null default false,
  interests text[] not null default '{}', notifications boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.subjects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 160), color text not null default '#7562ec',
 notes text not null default '', exams text not null default '', resources text not null default '',
 progress numeric not null default 0 check(progress between 0 and 100), created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.schedule (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 subject_id uuid, title text not null, day integer not null check(day between 0 and 6),
 start_time time not null,end_time time not null,room text not null default '',teacher text not null default '',color text not null default '#7562ec',
 created_at timestamptz not null default now(),check(end_time>start_time),
 foreign key(subject_id,user_id) references public.subjects(id,user_id)
);
create table public.tasks (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 subject_id uuid,title text not null check(length(title) between 1 and 160),subject text not null default '',
 deadline date not null,priority text not null check(priority in ('low','medium','high')),
 status text not null default 'todo' check(status in ('todo','progress','done')),description text not null default '',
 completed_at timestamptz, created_at timestamptz not null default now(),
 foreign key(subject_id,user_id) references public.subjects(id,user_id)
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, amount numeric(16,2) not null check(amount>0),category text not null,date date not null,
 type text not null check(type in ('income','expense','saving')),description text not null default '',created_at timestamptz not null default now()
);
create table public.budgets (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,amount numeric(16,2) not null check(amount>0),created_at timestamptz not null default now(),unique(user_id,title)
);
create table public.goals (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,deadline date not null, progress numeric not null default 0 check(progress between 0 and 100),description text not null default '',created_at timestamptz not null default now()
);
create table public.focus_sessions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null default now(),duration integer not null default 1500 check(duration=1500),
 completed boolean not null default false,ended_at timestamptz,
 check(not completed or (ended_at is not null and ended_at>=started_at+interval '25 minutes'))
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,company text not null,salary text not null,location text not null,skills text not null,
 kind text not null check(kind in ('Internship','Part-time','Freelance','Remote')),applied boolean not null default false,created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 title text not null,read boolean not null default false,created_at timestamptz not null default now()
);
create table public.ai_messages (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('user','assistant')),content text not null,created_at timestamptz not null default now()
);
-- Each query must ALSO be scoped by user_id in the future repository adapter.
do $$ declare name text; begin
 foreach name in array array['profiles','subjects','schedule','tasks','transactions','budgets','goals','focus_sessions','jobs','notifications','ai_messages'] loop
 execute format('alter table public.%I enable row level security',name);
 execute format('create policy owner_access on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',name);
 execute format('create index %I on public.%I(user_id)',name||'_owner_idx',name);
 execute format('grant select, insert, update, delete on public.%I to authenticated',name);
 end loop;
end $$;
-- AI and focus writes are server-only. JWT ownership still governs reads.
revoke insert,update,delete on public.ai_messages from authenticated;
revoke insert,update,delete on public.focus_sessions from authenticated;
create index tasks_owner_deadline on public.tasks(user_id,deadline);
create index transactions_owner_date on public.transactions(user_id,date);
create or replace function public.create_student_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(user_id,name,surname) values(new.id,coalesce(new.raw_user_meta_data->>'name',''),coalesce(new.raw_user_meta_data->>'surname',''));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_student_profile();

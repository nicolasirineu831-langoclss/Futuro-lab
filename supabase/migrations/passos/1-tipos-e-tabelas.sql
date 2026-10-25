-- PASSO 1 de 5. Cole este arquivo inteiro no SQL Editor e clique em Run.
-- Execute os passos NA ORDEM. Não rode o mesmo passo duas vezes.

-- FuturoLab · esquema inicial (Supabase / PostgreSQL)
-- Execute em um projeto NOVO, no SQL Editor do Supabase, uma única vez.
-- Regras de acesso são aplicadas no banco (RLS e triggers), não apenas na interface.

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.course_access as enum ('public', 'enrollment', 'private');
create type public.submission_status as enum ('draft', 'submitted', 'graded');

-- ---------- Tabelas ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null default 'Geral' check (char_length(category) <= 60),
  level text not null default 'Iniciante' check (char_length(level) <= 30),
  status public.course_status not null default 'draft',
  access public.course_access not null default 'enrollment',
  created_at timestamptz not null default now()
);

create table public.enrollments (
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  instructions text not null default '' check (char_length(instructions) <= 5000),
  due_at timestamptz,
  max_points numeric(5,2) not null default 10 check (max_points > 0 and max_points <= 100),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 10000),
  status public.submission_status not null default 'draft',
  submitted_at timestamptz,
  grade numeric(5,2) check (grade is null or grade >= 0),
  feedback text not null default '' check (char_length(feedback) <= 3000),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (activity_id, student_id)
);

create table public.lesson_progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_key text not null check (char_length(lesson_key) <= 120),
  done_at timestamptz not null default now(),
  primary key (student_id, course_id, lesson_key)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 500),
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

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

-- ---------- Funções auxiliares (SECURITY DEFINER evita recursão nas políticas) ----------

create or replace function public.app_user_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_user_role() = 'admin', false)
$$;

create or replace function public.can_manage_course(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.courses c
    where c.id = cid and (c.owner_id = auth.uid() or public.is_admin())
  )
$$;

create or replace function public.is_enrolled(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = cid and e.student_id = auth.uid()
  )
$$;

-- ---------- Triggers ----------

-- Todo usuário novo recebe o perfil de estudante. O papel nunca vem do cadastro público.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nome text := trim(coalesce(new.raw_user_meta_data->>'full_name', ''));
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    case when char_length(nome) between 2 and 80 then nome else 'Estudante' end,
    'student'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Só administradores podem mudar o papel de alguém. Alterações feitas no SQL Editor
-- (sem usuário autenticado) são permitidas, para promover o primeiro administrador.
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Somente administradores podem alterar o perfil de acesso.';
  end if;
  return new;
end $$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile();

-- Estudante não corrige; professor corrige. Nota não pode passar do valor da atividade.
create or replace function public.guard_submission() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  manager boolean;
  max_pts numeric;
  prazo timestamptz;
begin
  select public.can_manage_course(a.course_id), a.max_points, a.due_at
    into manager, max_pts, prazo
  from public.activities a where a.id = new.activity_id;

  if manager then
    if new.status = 'graded' and new.graded_at is null then
      new.graded_at := now();
    end if;
    if new.grade is not null and new.grade > max_pts then
      raise exception 'A nota não pode ser maior que o valor da atividade (%).', max_pts;
    end if;
  else
    if new.status = 'submitted' and prazo is not null and now() > prazo then
      raise exception 'O prazo desta atividade terminou.';
    end if;
    if tg_op = 'INSERT' then
      new.grade := null;
      new.feedback := '';
      new.graded_at := null;
      if new.status = 'graded' then new.status := 'draft'; end if;
    else
      if old.status = 'graded' then
        raise exception 'Esta entrega já foi corrigida e não pode mais ser alterada.';
      end if;
      new.grade := old.grade;
      new.feedback := old.feedback;
      new.graded_at := old.graded_at;
      if new.status = 'graded' then
        raise exception 'Somente o professor pode marcar uma entrega como corrigida.';
      end if;
    end if;
    if new.status = 'submitted' and (tg_op = 'INSERT' or old.status <> 'submitted') then
      new.submitted_at := now();
    end if;
  end if;
  return new;
end $$;

create trigger guard_submission_trg
  before insert or update on public.submissions
  for each row execute function public.guard_submission();

-- Avisa o estudante quando a entrega é corrigida.
create or replace function public.notify_graded() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'graded' and old.status is distinct from 'graded' then
    insert into public.notifications (user_id, title, body, link)
    values (new.student_id, 'Atividade corrigida',
            'Sua entrega foi corrigida. Veja a nota e o feedback.', '#/online');
  end if;
  return new;
end $$;

create trigger notify_graded_trg
  after update on public.submissions
  for each row execute function public.notify_graded();

-- Avisa os estudantes matriculados quando uma atividade é publicada.
create or replace function public.notify_activity_published() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.published and (tg_op = 'INSERT' or old.published is distinct from true) then
    insert into public.notifications (user_id, title, body, link)
    select e.student_id, 'Nova atividade publicada', new.title, '#/online/' || new.course_id
    from public.enrollments e where e.course_id = new.course_id;
  end if;
  return new;
end $$;

create trigger notify_activity_trg
  after insert or update on public.activities
  for each row execute function public.notify_activity_published();

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.activities enable row level security;
alter table public.submissions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;

-- profiles: cada um vê o próprio; admin vê todos; professor vê estudantes dos seus cursos
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin()
  or exists (
    select 1 from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.student_id = profiles.id and c.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.submissions s
    join public.activities a on a.id = s.activity_id
    join public.courses c on c.id = a.course_id
    where s.student_id = profiles.id and c.owner_id = auth.uid()
  )
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- courses: publicados são visíveis a usuários autenticados; rascunhos só ao dono e admin
create policy courses_select on public.courses for select to authenticated using (
  status = 'published' or owner_id = auth.uid() or public.is_admin()
);
create policy courses_insert on public.courses for insert to authenticated with check (
  owner_id = auth.uid() and public.app_user_role() in ('teacher', 'admin')
);
create policy courses_update on public.courses for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy courses_delete on public.courses for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- enrollments: estudante só se matricula em curso público publicado; professor gerencia os seus
create policy enrollments_select on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.can_manage_course(course_id));
create policy enrollments_insert on public.enrollments for insert to authenticated with check (
  (student_id = auth.uid() and exists (
     select 1 from public.courses c
     where c.id = course_id and c.status = 'published' and c.access = 'public'))
  or public.can_manage_course(course_id)
);
create policy enrollments_delete on public.enrollments for delete to authenticated
  using (student_id = auth.uid() or public.can_manage_course(course_id));

-- activities: professor gerencia; estudante matriculado vê só as publicadas
create policy activities_select on public.activities for select to authenticated using (
  public.can_manage_course(course_id) or (published and public.is_enrolled(course_id))
);
create policy activities_write on public.activities for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

-- submissions: estudante vê e envia as suas (atividade publicada, matriculado); professor vê e corrige
create policy submissions_select on public.submissions for select to authenticated using (
  student_id = auth.uid()
  or exists (select 1 from public.activities a
             where a.id = activity_id and public.can_manage_course(a.course_id))
);
create policy submissions_insert on public.submissions for insert to authenticated with check (
  (student_id = auth.uid() and exists (
     select 1 from public.activities a
     where a.id = activity_id and a.published and public.is_enrolled(a.course_id)))
  or exists (select 1 from public.activities a
             where a.id = activity_id and public.can_manage_course(a.course_id))
);
create policy submissions_update on public.submissions for update to authenticated
  using (
    student_id = auth.uid()
    or exists (select 1 from public.activities a
               where a.id = activity_id and public.can_manage_course(a.course_id))
  )
  with check (
    student_id = auth.uid()
    or exists (select 1 from public.activities a
               where a.id = activity_id and public.can_manage_course(a.course_id))
  );

-- progresso: o estudante grava o seu (somente em cursos em que está matriculado); professor lê
create policy progress_own on public.lesson_progress for all to authenticated
  using (student_id = auth.uid() and public.is_enrolled(course_id))
  with check (student_id = auth.uid() and public.is_enrolled(course_id));
create policy progress_teacher_read on public.lesson_progress for select to authenticated
  using (public.can_manage_course(course_id));

-- anotações pessoais: somente do dono
create policy notes_own on public.notes for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- notificações: o destinatário lê e marca como lida; escrita é feita pelos triggers
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

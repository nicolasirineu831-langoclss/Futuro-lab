-- PASSO 4 de 5. Cole este arquivo inteiro no SQL Editor e clique em Run.
-- Execute os passos NA ORDEM. Não rode o mesmo passo duas vezes.

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

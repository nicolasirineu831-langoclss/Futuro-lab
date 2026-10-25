-- PASSO 5 de 5. Cole este arquivo inteiro no SQL Editor e clique em Run.
-- Execute os passos NA ORDEM. Não rode o mesmo passo duas vezes.

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

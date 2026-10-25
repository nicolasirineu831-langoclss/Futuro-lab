-- PASSO 3 de 5. Cole este arquivo inteiro no SQL Editor e clique em Run.
-- Execute os passos NA ORDEM. Não rode o mesmo passo duas vezes.

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

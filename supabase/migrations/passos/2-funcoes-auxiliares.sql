-- PASSO 2 de 5. Cole este arquivo inteiro no SQL Editor e clique em Run.
-- Execute os passos NA ORDEM. Não rode o mesmo passo duas vezes.

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

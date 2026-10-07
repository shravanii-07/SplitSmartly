CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles (lower(email));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX groups_created_by_idx ON public.groups (created_by);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX group_members_user_idx ON public.group_members (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id AND created_by = _user_id);
$$;

CREATE POLICY "groups_select_members" ON public.groups FOR SELECT TO authenticated
  USING (public.is_group_member(id, auth.uid()) OR created_by = auth.uid());
CREATE POLICY "groups_insert_own" ON public.groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_update_owner" ON public.groups FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_delete_owner" ON public.groups FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "group_members_select" ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()) OR public.is_group_owner(group_id, auth.uid()));
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_group_owner(group_id, auth.uid()) OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "group_members_delete" ON public.group_members FOR DELETE TO authenticated
  USING (public.is_group_owner(group_id, auth.uid()) OR user_id = auth.uid());

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Other',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX expenses_group_idx ON public.expenses (group_id);
CREATE INDEX expenses_paid_by_idx ON public.expenses (paid_by);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select_members" ON public.expenses FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "expenses_insert_members" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()) AND public.is_group_member(group_id, paid_by));
CREATE POLICY "expenses_delete_members" ON public.expenses FOR DELETE TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE TABLE public.expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_amount NUMERIC(12,2) NOT NULL CHECK (share_amount >= 0),
  UNIQUE (expense_id, user_id)
);
CREATE INDEX expense_participants_expense_idx ON public.expense_participants (expense_id);
CREATE INDEX expense_participants_user_idx ON public.expense_participants (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_participants TO authenticated;
GRANT ALL ON public.expense_participants TO service_role;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_participants_select" ON public.expense_participants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND public.is_group_member(e.group_id, auth.uid())));
CREATE POLICY "expense_participants_insert" ON public.expense_participants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND public.is_group_member(e.group_id, auth.uid())));
CREATE POLICY "expense_participants_delete" ON public.expense_participants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND public.is_group_member(e.group_id, auth.uid())));

CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX settlements_group_idx ON public.settlements (group_id);
CREATE INDEX settlements_status_idx ON public.settlements (group_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settlements TO authenticated;
GRANT ALL ON public.settlements TO service_role;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements_select" ON public.settlements FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "settlements_insert" ON public.settlements FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "settlements_update" ON public.settlements FOR UPDATE TO authenticated
  USING (public.is_group_member(group_id, auth.uid())) WITH CHECK (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "settlements_delete" ON public.settlements FOR DELETE TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
-- 1. TABLA DE GRUPOS
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA JUNCIÓN DE MIEMBROS DE GRUPO
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (group_id, profile_id)
);

-- 3. ACTIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS PARA LA TABLA GROUPS

-- Lectura: Un usuario puede leer un grupo si es el creador o si es miembro del grupo
CREATE POLICY "Users can view groups they belong to or created"
  ON public.groups FOR SELECT
  USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = id 
      AND group_members.profile_id = auth.uid()
    )
  );

-- Inserción: Cualquier usuario autenticado puede crear un grupo asignándose como creador
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Actualización: Solo el creador del grupo puede actualizar su información
CREATE POLICY "Creators can update their groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = created_by);

-- Eliminación: Solo el creador del grupo puede eliminarlo
CREATE POLICY "Creators can delete their groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = created_by);


-- 5. POLÍTICAS PARA LA TABLA GROUP_MEMBERS

-- Lectura: Un miembro o el creador del grupo puede ver las afiliaciones de ese grupo
CREATE POLICY "Members and creators can view membership list"
  ON public.group_members FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_id 
      AND (groups.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_id AND gm.profile_id = auth.uid()
      ))
    )
  );

-- Inserción: Solo el creador del grupo puede invitar/añadir miembros al grupo
CREATE POLICY "Only group creators can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_id 
      AND groups.created_by = auth.uid()
    )
  );

-- Eliminación: El creador del grupo puede remover a cualquiera, o un miembro puede salirse del grupo
CREATE POLICY "Creators can remove members or members can leave"
  ON public.group_members FOR DELETE
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_id 
      AND groups.created_by = auth.uid()
    )
  );


-- 6. TRIGGER POSTGRES PARA AUTO-AGREGAR AL CREADOR COMO MIEMBRO
-- Cuando un grupo es insertado, el creador se registra automáticamente en group_members
CREATE OR REPLACE FUNCTION public.handle_new_group_member()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.group_members (group_id, profile_id)
  VALUES (new.id, new.created_by)
  ON CONFLICT (group_id, profile_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_group_member();

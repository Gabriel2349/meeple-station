-- =============================================
-- SPRINT 4: GAME SESSIONS SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. TABLE: game_sessions
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name TEXT NOT NULL,
  game_image_url TEXT,
  mode TEXT NOT NULL DEFAULT 'casual',        -- 'closed_group' | 'hybrid' | 'casual'
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'finished'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE: session_players
--    Represents each participant in a session.
--    profile_id is NULL for anonymous (guest) players.
CREATE TABLE IF NOT EXISTS public.session_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- NULL = anonymous
  display_name TEXT NOT NULL,                 -- Always set (for anonymous players too)
  score INTEGER NOT NULL DEFAULT 0,
  position INTEGER,                           -- Final ranking position (1st, 2nd...) set at end
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

-- 4. HELPER FUNCTION: Check if current user is a participant of a session
--    SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_session_participant(sid uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM session_players
    WHERE session_id = sid AND profile_id = uid
  );
$$;

-- 5. POLICIES FOR game_sessions

-- Read: creators and registered participants can read
CREATE POLICY "Session creators and participants can view sessions"
  ON public.game_sessions FOR SELECT
  USING (
    auth.uid() = created_by
    OR public.is_session_participant(id, auth.uid())
  );

-- Insert: any authenticated user can create a session
CREATE POLICY "Authenticated users can create sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Update: only the creator can update session details
CREATE POLICY "Session creator can update session"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = created_by);

-- Delete: only the creator can delete a session
CREATE POLICY "Session creator can delete session"
  ON public.game_sessions FOR DELETE
  USING (auth.uid() = created_by);


-- 6. POLICIES FOR session_players

-- Read: creator of session or any registered participant can read all players
CREATE POLICY "Session members can view all players"
  ON public.session_players FOR SELECT
  USING (
    public.is_session_participant(session_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = session_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- Insert: session creator can add players
CREATE POLICY "Session creator can add players"
  ON public.session_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = session_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- Update: session creator can update scores / positions
CREATE POLICY "Session creator can update player scores"
  ON public.session_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = session_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- Delete: session creator can remove players
CREATE POLICY "Session creator can remove players"
  ON public.session_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = session_id
      AND game_sessions.created_by = auth.uid()
    )
  );

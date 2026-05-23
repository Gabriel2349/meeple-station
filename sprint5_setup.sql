-- =============================================
-- SPRINT 5: ENABLE SUPABASE REALTIME
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add session_players to the realtime publication
--    This allows clients to subscribe to score changes in real time.
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;

-- 2. Add game_sessions to realtime as well
--    This lets clients detect when a session is finished by another device.
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- =============================================
-- OPTIONAL: Add index for faster session queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_session_players_session_id
  ON public.session_players(session_id);

CREATE INDEX IF NOT EXISTS idx_game_sessions_created_by
  ON public.game_sessions(created_by);

CREATE INDEX IF NOT EXISTS idx_game_sessions_status
  ON public.game_sessions(status);

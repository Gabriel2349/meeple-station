-- =============================================
-- ADD HAS_ROUNDS AND CURRENT_ROUND TO GAME_SESSIONS
-- Run this in your Supabase SQL Editor
-- =============================================

ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS has_rounds BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;

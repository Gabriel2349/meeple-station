import { supabase } from "@/utils/supabaseClient";

export type SessionMode = "closed_group" | "hybrid" | "casual";
export type SessionStatus = "active" | "finished";

export interface SessionPlayer {
  id: string;
  session_id: string;
  profile_id: string | null;     // null = anonymous player
  display_name: string;
  score: number;
  position: number | null;
  joined_at: string;
}

export interface GameSession {
  id: string;
  game_name: string;
  game_image_url: string | null;
  mode: SessionMode;
  group_id: string | null;
  created_by: string;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  has_rounds: boolean;
  current_round: number;
  session_players?: SessionPlayer[];
}

export interface CreateSessionInput {
  game_name: string;
  game_image_url?: string;
  mode: SessionMode;
  group_id?: string;
  created_by: string;
  has_rounds?: boolean;
  players: {
    profile_id?: string;   // registered user
    display_name: string;  // always required
  }[];
}

export const SessionRepository = {
  /**
   * Creates a session + inserts all players in one flow.
   */
  async createSession(input: CreateSessionInput): Promise<GameSession> {
    // 1. Create the session
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .insert({
        game_name: input.game_name.trim(),
        game_image_url: input.game_image_url || null,
        mode: input.mode,
        group_id: input.group_id || null,
        created_by: input.created_by,
        status: "active",
        has_rounds: input.has_rounds || false,
        current_round: 1,
      })
      .select()
      .single();

    if (sessionError) throw new Error(sessionError.message);

    // 2. Insert all players
    const playerRows = input.players.map((p) => ({
      session_id: session.id,
      profile_id: p.profile_id || null,
      display_name: p.display_name.trim(),
      score: 0,
    }));

    const { error: playersError } = await supabase
      .from("session_players")
      .insert(playerRows);

    if (playersError) {
      // Rollback: delete the session if players failed
      await supabase.from("game_sessions").delete().eq("id", session.id);
      throw new Error(playersError.message);
    }

    return session;
  },

  /**
   * Get all sessions for the current user (created by or participated in).
   */
  async getMySessions(): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from("game_sessions")
      .select(`
        *,
        session_players(*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get a single session with all its players.
   */
  async getSessionDetails(sessionId: string): Promise<GameSession> {
    const { data, error } = await supabase
      .from("game_sessions")
      .select(`
        *,
        session_players(*)
      `)
      .eq("id", sessionId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update a single player's score.
   */
  async updateScore(playerId: string, score: number): Promise<void> {
    const { error } = await supabase
      .from("session_players")
      .update({ score })
      .eq("id", playerId);

    if (error) throw new Error(error.message);
  },

  /**
   * Finish a session: set status to finished, record time, assign positions.
   */
  async finishSession(
    sessionId: string,
    playerRankings: { id: string; position: number }[]
  ): Promise<void> {
    // Update positions
    for (const p of playerRankings) {
      await supabase
        .from("session_players")
        .update({ position: p.position })
        .eq("id", p.id);
    }

    // Mark session as finished
    const { error } = await supabase
      .from("game_sessions")
      .update({
        status: "finished",
        finished_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) throw new Error(error.message);
  },

  /**
   * Delete a session permanently.
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("game_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) throw new Error(error.message);
  },

  /**
   * Update the current round of a session.
   */
  async updateSessionRound(sessionId: string, round: number): Promise<void> {
    const { error } = await supabase
      .from("game_sessions")
      .update({ current_round: Math.max(1, round) })
      .eq("id", sessionId);

    if (error) throw new Error(error.message);
  },
};

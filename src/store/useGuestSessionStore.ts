import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestPlayer {
  id: string;
  display_name: string;
  score: number;
  position?: number;
}

export interface GuestSession {
  id: string;
  game_name: string;
  mode: "casual";
  players: GuestPlayer[];
  status: "active" | "finished";
  started_at: string;
  finished_at?: string;
  has_rounds?: boolean;
  current_round?: number;
}

interface GuestSessionState {
  session: GuestSession | null;
  history: GuestSession[];
  createSession: (game_name: string, playerNames: string[], hasRounds?: boolean) => void;
  updateScore: (playerId: string, score: number) => void;
  updateRound: (round: number) => void;
  finishSession: () => void;
  clearSession: () => void;
  deleteHistorySession: (sessionId: string) => void;
}

const genId = () => Math.random().toString(36).slice(2, 10);

export const useGuestSessionStore = create<GuestSessionState>()(
  persist(
    (set, get) => ({
      session: null,
      history: [],

      createSession: (game_name: string, playerNames: string[], hasRounds?: boolean) => {
        const players: GuestPlayer[] = playerNames.map((name) => ({
          id: genId(),
          display_name: name,
          score: 0,
        }));
        set({
          session: {
            id: `guest-${genId()}`,
            game_name,
            mode: "casual",
            players,
            status: "active",
            started_at: new Date().toISOString(),
            has_rounds: hasRounds || false,
            current_round: 1,
          },
        });
      },

      updateScore: (playerId: string, score: number) => {
        const session = get().session;
        if (!session) return;
        set({
          session: {
            ...session,
            players: session.players.map((p) =>
              p.id === playerId ? { ...p, score } : p
            ),
          },
        });
      },

      updateRound: (round: number) => {
        const session = get().session;
        if (!session) return;
        set({
          session: {
            ...session,
            current_round: Math.max(1, round),
          },
        });
      },

      finishSession: () => {
        const session = get().session;
        if (!session) return;
        const sorted = [...session.players].sort((a, b) => b.score - a.score);
        const finishedSession: GuestSession = {
          ...session,
          status: "finished",
          finished_at: new Date().toISOString(),
          players: sorted.map((p, i) => ({ ...p, position: i + 1 })),
        };
        set({
          session: finishedSession,
          history: [finishedSession, ...get().history],
        });
      },

      clearSession: () => set({ session: null }),

      deleteHistorySession: (sessionId: string) => {
        set({
          history: get().history.filter((s) => s.id !== sessionId),
        });
      },
    }),
    { name: "meeple-station-guest-session" }
  )
);

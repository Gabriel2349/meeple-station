import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestPlayer {
  id: string;
  display_name: string;
  score: number;
  position?: number;
}

export interface GuestSession {
  game_name: string;
  mode: "casual";
  players: GuestPlayer[];
  status: "active" | "finished";
  started_at: string;
  finished_at?: string;
}

interface GuestSessionState {
  session: GuestSession | null;
  createSession: (game_name: string, playerNames: string[]) => void;
  updateScore: (playerId: string, score: number) => void;
  finishSession: () => void;
  clearSession: () => void;
}

const genId = () => Math.random().toString(36).slice(2, 10);

export const useGuestSessionStore = create<GuestSessionState>()(
  persist(
    (set, get) => ({
      session: null,

      createSession: (game_name: string, playerNames: string[]) => {
        const players: GuestPlayer[] = playerNames.map((name) => ({
          id: genId(),
          display_name: name,
          score: 0,
        }));
        set({
          session: {
            game_name,
            mode: "casual",
            players,
            status: "active",
            started_at: new Date().toISOString(),
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

      finishSession: () => {
        const session = get().session;
        if (!session) return;
        const sorted = [...session.players].sort((a, b) => b.score - a.score);
        set({
          session: {
            ...session,
            status: "finished",
            finished_at: new Date().toISOString(),
            players: sorted.map((p, i) => ({ ...p, position: i + 1 })),
          },
        });
      },

      clearSession: () => set({ session: null }),
    }),
    { name: "meeple-station-guest-session" }
  )
);

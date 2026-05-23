import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/utils/supabaseClient";
import { useTimerStore } from "./useTimerStore";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthState {
  user: Profile | null;
  guestName: string | null;
  isGuest: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  error: string | null;
  setHasHydrated: (val: boolean) => void;
  setGuest: (name: string) => void;
  setUser: (user: Profile | null) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      guestName: null,
      isGuest: false,
      isLoading: true,
      _hasHydrated: false,
      error: null,

      setHasHydrated: (val: boolean) => {
        set({ _hasHydrated: val });
      },

      setGuest: (name: string) => {
        useTimerStore.getState().clearTimer();
        set({
          guestName: name,
          isGuest: true,
          user: null,
          error: null,
        });
      },

      setUser: (user: Profile | null) => {
        useTimerStore.getState().clearTimer();
        set({
          user,
          isGuest: false,
          guestName: null,
          error: null,
        });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          useTimerStore.getState().clearTimer();
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({
            user: null,
            guestName: null,
            isGuest: false,
            error: null,
          });
        } catch (err: any) {
          set({ error: err.message });
        } finally {
          set({ isLoading: false });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch public profile info
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (error) throw error;
            set({
              user: profile,
              isGuest: false,
              guestName: null,
            });
          } else if (!get().isGuest) {
            // Only clear if not in guest mode
            set({ user: null });
          }
        } catch (err: any) {
          console.error("Session check error:", err);
          // Don't force clear — may be a network glitch
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "meeple-station-auth",
      partialize: (state) => ({
        user: state.user,
        guestName: state.guestName,
        isGuest: state.isGuest,
      }),
      // Called once Zustand finishes reading state from localStorage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

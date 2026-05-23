import { create } from "zustand";

export interface TimerPlayer {
  id: string;
  name: string;
}

export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface TimerState {
  sessionId: string | null;
  players: TimerPlayer[];
  currentIdx: number;
  timeLimit: number; // seconds, 0 = no limit configured
  timeLeft: number;  // seconds remaining for current turn
  status: TimerStatus;

  // Actions
  setupTimer: (sessionId: string, players: TimerPlayer[], timeLimitSeconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  skipTurn: () => void;
  resetTurn: () => void;
  clearTimer: () => void;
  _tick: () => void; // internal — called by interval
}

// Module-level interval — survives React component unmounts / navigation
let _intervalId: ReturnType<typeof setInterval> | null = null;

function _startInterval() {
  if (_intervalId !== null) return;
  _intervalId = setInterval(() => {
    useTimerStore.getState()._tick();
  }, 1000);
}

function _stopInterval() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  sessionId: null,
  players: [],
  currentIdx: 0,
  timeLimit: 60,
  timeLeft: 60,
  status: "idle",

  setupTimer: (sessionId, players, timeLimitSeconds) => {
    _stopInterval();
    const oldIdx = get().currentIdx;
    const oldPlayers = get().players;
    let nextIdx = 0;
    if (oldPlayers.length > 0 && oldIdx >= 0 && oldIdx < oldPlayers.length) {
      const activePlayerName = oldPlayers[oldIdx].name;
      const newIdx = players.findIndex((p) => p.name === activePlayerName);
      if (newIdx !== -1) {
        nextIdx = newIdx;
      }
    }
    set({
      sessionId,
      players,
      currentIdx: nextIdx,
      timeLimit: timeLimitSeconds,
      timeLeft: timeLimitSeconds,
      status: "idle",
    });
  },

  startTimer: () => {
    if (get().status !== "idle") return;
    set({ status: "running" });
    _startInterval();
  },

  pauseTimer: () => {
    if (get().status !== "running") return;
    set({ status: "paused" });
    _stopInterval();
  },

  resumeTimer: () => {
    if (get().status !== "paused") return;
    set({ status: "running" });
    _startInterval();
  },

  skipTurn: () => {
    const { players, currentIdx, timeLimit } = get();
    const nextIdx = (currentIdx + 1) % players.length;
    set({ currentIdx: nextIdx, timeLeft: timeLimit });
    // Keep running if it was running
    const { status } = get();
    if (status === "running") {
      _stopInterval();
      _startInterval();
    }
  },

  resetTurn: () => {
    const { timeLimit } = get();
    set({ timeLeft: timeLimit });
  },

  clearTimer: () => {
    _stopInterval();
    set({
      sessionId: null,
      players: [],
      currentIdx: 0,
      timeLimit: 60,
      timeLeft: 60,
      status: "idle",
    });
  },

  _tick: () => {
    const { timeLeft, timeLimit, currentIdx, players, status } = get();
    if (status !== "running") return;
    if (timeLeft <= 1) {
      // Auto-advance to next player
      const nextIdx = (currentIdx + 1) % players.length;
      set({ currentIdx: nextIdx, timeLeft: timeLimit });
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },
}));

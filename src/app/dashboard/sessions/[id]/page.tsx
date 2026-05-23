"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTimerStore } from "@/store/useTimerStore";
import type { Translations } from "@/translations";
import {
  GameSession,
  SessionPlayer,
  SessionRepository,
} from "@/repositories/SessionRepository";
import { supabase } from "@/utils/supabaseClient";
import { FlashPicker } from "@/components/FlashPicker";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Clock,
  CheckCircle2,
  Plus,
  Minus,
  Flag,
  AlertCircle,
  Users,
  Dices,
  Timer,
  SkipForward,
  RotateCcw,
  Play,
  Pause,
  Settings,
  X,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Timer Panel Component ──────────────────────────────────────────────────────
function TimerPanel({ players, sessionId, t, onTimerAction }: {
  players: SessionPlayer[];
  sessionId: string;
  t: Translations;
  onTimerAction?: (action: any) => void;
}) {
  const timer = useTimerStore();
  const [showSetup, setShowSetup] = useState(false);
  const [inputSeconds, setInputSeconds] = useState("60");
  const isMySession = timer.sessionId === sessionId;
  const isActive = isMySession && (timer.status === "running" || timer.status === "paused" || timer.status === "idle");

  const handleSetup = () => {
    const secs = parseInt(inputSeconds, 10);
    if (!secs || secs < 5) return;
    const timerPlayers = players.map((p) => ({ id: p.id, name: p.display_name }));
    timer.setupTimer(
      sessionId,
      timerPlayers,
      secs
    );
    onTimerAction?.({ type: "setup", players: timerPlayers, timeLimit: secs });
    setShowSetup(false);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const currentPlayer = isMySession ? timer.players[timer.currentIdx] : null;
  const timeLeft = isMySession ? timer.timeLeft : 0;
  const pct = isMySession && timer.timeLimit > 0
    ? (timeLeft / timer.timeLimit) * 100
    : 100;

  return (
    <div className="glass-card border-slate-800/60 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-sm text-white">{t.sessions.turnTimer}</span>
        </div>
        <button
          onClick={() => setShowSetup(!showSetup)}
          className="p-1.5 text-slate-500 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-all cursor-pointer"
        >
          {showSetup ? <X className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Setup panel */}
      {showSetup && (
        <div className="px-4 flex flex-col gap-3 pb-2">
          <label className="text-xs text-slate-400">{t.sessions.timerLimitLabel}</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={5}
              max={600}
              value={inputSeconds}
              onChange={(e) => setInputSeconds(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-500/50"
            />
            <button
              onClick={handleSetup}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl border border-brand-600/30 transition-all cursor-pointer"
            >
              {t.common.confirm}
            </button>
          </div>
          {[30, 60, 90, 120].map((s) => (
            <button
              key={s}
              onClick={() => setInputSeconds(s.toString())}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${inputSeconds === s.toString() ? "bg-brand-500/20 border-brand-500/30 text-brand-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}
            >
              {s}s
            </button>
          ))}
        </div>
      )}

      {/* Timer display */}
      {!showSetup && isMySession && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Current player */}
          <div className="text-center">
            <p className="text-xs text-slate-400">{t.sessions.currentTurn}</p>
            <p className="font-display font-bold text-lg text-white mt-0.5">
              {currentPlayer?.name ?? "—"}
            </p>
          </div>

          {/* Progress arc + time */}
          <div className="relative flex items-center justify-center py-2">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={timeLeft <= 10 ? "#ef4444" : "#8b5cf6"}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`font-mono font-bold text-2xl tabular-nums ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {fmt(timeLeft)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                timer.resetTurn();
                onTimerAction?.({ type: "reset" });
              }}
              disabled={timer.status === "idle"}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
              title={t.sessions.timerReset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {timer.status === "idle" && (
              <button
                onClick={() => {
                  timer.startTimer();
                  onTimerAction?.({ type: "start" });
                }}
                className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold border border-brand-600/30 transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> {t.sessions.timerStart}
              </button>
            )}
            {timer.status === "running" && (
              <button
                onClick={() => {
                  timer.pauseTimer();
                  onTimerAction?.({ type: "pause" });
                }}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <Pause className="w-4 h-4" /> {t.sessions.timerPause}
              </button>
            )}
            {timer.status === "paused" && (
              <button
                onClick={() => {
                  timer.resumeTimer();
                  onTimerAction?.({ type: "resume" });
                }}
                className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold border border-brand-600/30 transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> {t.sessions.timerResume}
              </button>
            )}

            <button
              onClick={() => {
                timer.skipTurn();
                onTimerAction?.({ type: "skip" });
              }}
              disabled={timer.status === "idle"}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30"
              title={t.sessions.timerSkip}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!showSetup && !isMySession && (
        <div className="px-4 pb-4 text-center text-sm text-slate-500">
          {t.sessions.timerIdle}
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────
export default function SessionDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const { user, isLoading: isAuthLoading } = useRequireAuth(false);
  const { t } = useLanguageStore();

  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pendingScores, setPendingScores] = useState<Record<string, number>>({});
  const [savingScores, setSavingScores] = useState<Record<string, boolean>>({});
  const scoreTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [finishing, setFinishing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [elapsed, setElapsed] = useState("0m");

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const sendTimerAction = useCallback((action: { type: string; [key: string]: any }) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "timer-action",
        payload: action,
      });
    }
  }, []);

  const handleWinnerChosen = useCallback((winnerName: string) => {
    const idx = players.findIndex((p) => p.display_name === winnerName);
    if (idx !== -1) {
      useTimerStore.setState({ currentIdx: idx });
      sendTimerAction({ type: "sync-index", currentIdx: idx });
    }
  }, [players, sendTimerAction]);

  // ── Load session ──────────────────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await SessionRepository.getSessionDetails(sessionId);
      setSession(data);
      setPlayers(data.session_players || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not load session.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isAuthLoading && user) loadSession();
  }, [user, isAuthLoading, loadSession]);

  // ── Clean up timer store if this session has finished ───────────────────────
  useEffect(() => {
    if (session && session.status === "finished") {
      const timerState = useTimerStore.getState();
      if (timerState.sessionId === sessionId) {
        timerState.clearTimer();
      }
    }
  }, [session, sessionId]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status === "finished") return;
    const tick = () => {
      const start = new Date(session.started_at);
      const mins = Math.round((Date.now() - start.getTime()) / 60000);
      setElapsed(mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
    };
    tick();
    const iv = setInterval(tick, 15000);
    return () => clearInterval(iv);
  }, [session]);

  // ── Supabase Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !user) return;

    // Subscribe to session_players changes
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_players",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as SessionPlayer;
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? { ...p, score: updated.score, position: updated.position }
                : p
            )
          );
          // Clear pending if it was us who triggered it
          setPendingScores((prev) => {
            const copy = { ...prev };
            delete copy[updated.id];
            return copy;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          // Session updated (e.g. finished by another device) — reload
          loadSession();
        }
      )
      .on(
        "broadcast",
        { event: "timer-action" },
        (payload) => {
          const action = payload.payload;
          const timerState = useTimerStore.getState();
          if (action.type === "setup") {
            timerState.setupTimer(sessionId, action.players, action.timeLimit);
          } else if (action.type === "start") {
            if (timerState.status === "idle") timerState.startTimer();
          } else if (action.type === "pause") {
            timerState.pauseTimer();
          } else if (action.type === "resume") {
            timerState.resumeTimer();
          } else if (action.type === "skip") {
            timerState.skipTurn();
          } else if (action.type === "reset") {
            timerState.resetTurn();
          } else if (action.type === "clear") {
            timerState.clearTimer();
          } else if (action.type === "sync-index") {
            useTimerStore.setState({ currentIdx: action.currentIdx });
          }
        }
      )
      .on(
        "broadcast",
        { event: "request-sync" },
        () => {
          const state = useTimerStore.getState();
          if (state.sessionId === sessionId) {
            channel.send({
              type: "broadcast",
              event: "timer-state",
              payload: {
                timeLimit: state.timeLimit,
                timeLeft: state.timeLeft,
                status: state.status,
                currentIdx: state.currentIdx,
                players: state.players,
              },
            });
          }
        }
      )
      .on(
        "broadcast",
        { event: "timer-state" },
        (payload) => {
          const state = payload.payload;
          const timerState = useTimerStore.getState();
          if (timerState.sessionId !== sessionId || timerState.status === "idle") {
            timerState.clearTimer();
            useTimerStore.setState({
              sessionId,
              timeLimit: state.timeLimit,
              timeLeft: state.timeLeft,
              status: state.status,
              currentIdx: state.currentIdx,
              players: state.players,
            });
            if (state.status === "running") {
              useTimerStore.setState({ status: "paused" });
              useTimerStore.getState().resumeTimer();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "request-sync",
            payload: {},
          });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, loadSession]);

  // ── Score handling ────────────────────────────────────────────────────────
  const getDisplayScore = (player: SessionPlayer) =>
    pendingScores[player.id] !== undefined ? pendingScores[player.id] : player.score;

  const saveScore = (player: SessionPlayer, nextValue: number) => {
    if (session?.status === "finished") return;
    const next = Math.max(0, nextValue);
    setPendingScores((prev) => ({ ...prev, [player.id]: next }));

    // Debounce save
    if (scoreTimers.current[player.id]) clearTimeout(scoreTimers.current[player.id]);
    scoreTimers.current[player.id] = setTimeout(async () => {
      try {
        setSavingScores((prev) => ({ ...prev, [player.id]: true }));
        await SessionRepository.updateScore(player.id, next);
        setPlayers((prev) =>
          prev.map((p) => (p.id === player.id ? { ...p, score: next } : p))
        );
        setPendingScores((prev) => {
          const copy = { ...prev };
          delete copy[player.id];
          return copy;
        });
      } finally {
        setSavingScores((prev) => ({ ...prev, [player.id]: false }));
      }
    }, 700);
  };

  const changeScore = (player: SessionPlayer, delta: number) => {
    const current = getDisplayScore(player);
    saveScore(player, current + delta);
  };

  // ── Finish session ────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!session) return;
    if (!confirm(t.sessions.finishSession + "?")) return;
    try {
      setFinishing(true);
      const sorted = [...players]
        .sort((a, b) => getDisplayScore(b) - getDisplayScore(a))
        .map((p, i) => ({ id: p.id, position: i + 1 }));
      await SessionRepository.finishSession(session.id, sorted);
      await loadSession();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFinishing(false);
    }
  };

  const getDuration = () => {
    if (!session) return "—";
    const start = new Date(session.started_at);
    const end = session.finished_at ? new Date(session.finished_at) : new Date();
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const isOwner = user && session?.created_by === user.id;
  const isActive = session?.status === "active";

  // Scoreboard order: Keep original turn order (by joined_at) while playing.
  // Sort by ranking/score ONLY when the match is completed/finished.
  const displayPlayers = isActive
    ? [...players].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
    : [...players].sort((a, b) => {
        if (a.position !== null && b.position !== null) return a.position - b.position;
        return getDisplayScore(b) - getDisplayScore(a);
      });

  if (isAuthLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[60vh] text-center">
        <div className="glass-card p-8 max-w-md w-full flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold font-display">Session Not Found</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
          <Link href="/dashboard/sessions" className="mt-2 w-full py-2.5 px-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6 animate-fade-in">
      {/* Flash Picker */}
      {showFlash && (
        <FlashPicker
          players={players.map((p) => p.display_name)}
          onClose={() => setShowFlash(false)}
          onWinnerChosen={handleWinnerChosen}
        />
      )}

      {/* Session header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-white">{session.game_name}</h1>
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${isActive ? "bg-brand-500/10 text-brand-400 border-brand-500/20" : "bg-slate-900 text-slate-400 border-slate-800"}`}>
              {isActive ? `● ${t.sessions.active}` : `✓ ${t.sessions.finished}`}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {isActive ? `${t.sessions.elapsed}: ${elapsed}` : `${t.sessions.duration}: ${getDuration()}`}
          </p>
        </div>
        {isOwner && isActive && (
          <button onClick={handleFinish} disabled={finishing} className="shrink-0 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-medium py-2 px-4 rounded-xl border border-red-950/30 transition-all flex items-center gap-2 cursor-pointer text-xs">
            {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            {t.sessions.finishSession}
          </button>
        )}
      </div>

      {/* Finished Banner */}
      {!isActive && (
        <div className="glass-card p-5 border-brand-500/20 bg-brand-500/5 flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{t.sessions.sessionComplete}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              🏆 {t.sessions.winner}:{" "}
              <strong className="text-brand-400">{displayPlayers[0]?.display_name}</strong>
              {" "}· {getDuration()}
            </p>
          </div>
        </div>
      )}

      {/* Action toolbar */}
      {isActive && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowFlash(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 hover:border-purple-500/30 text-purple-400 rounded-xl transition-all cursor-pointer text-sm font-medium"
          >
            <Dices className="w-4 h-4" />
            {t.sessions.flashBtn}
          </button>
        </div>
      )}

      {/* Turn Timer */}
      {isActive && (
        <TimerPanel players={players} sessionId={sessionId} t={t} onTimerAction={sendTimerAction} />
      )}

      {/* Scoreboard */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          {t.sessions.scoreboard}
        </h2>

        {displayPlayers.map((player, rank) => {
          const score = getDisplayScore(player);
          const isSaving = savingScores[player.id];
          const isWinner = !isActive && rank === 0;

          return (
            <div
              key={player.id}
              className={`glass-card p-4 border transition-all ${isWinner ? "border-brand-500/30 bg-brand-500/5" : "border-slate-800/60"}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border shrink-0 ${
                  rank === 0 ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-white border-amber-500/30"
                  : rank === 1 ? "bg-slate-700 text-slate-200 border-slate-600"
                  : rank === 2 ? "bg-amber-950/40 text-amber-600 border-amber-900/30"
                  : "bg-slate-900 text-slate-400 border-slate-800"
                }`}>
                  {rank + 1}
                </div>

                {/* Name */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-white text-sm truncate">{player.display_name}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">
                    {player.profile_id ? "Registered" : "Guest"}
                  </span>
                </div>

                {/* Score controls */}
                <div className="flex items-center gap-2">
                  {isActive && (
                    <button onClick={() => changeScore(player, -1)} className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/30 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center cursor-pointer">
                      <Minus className="w-4 h-4" />
                    </button>
                  )}

                  <div className="min-w-[64px] text-center flex items-center justify-center gap-1">
                    {isActive ? (
                      <input
                        type="number"
                        min={0}
                        value={score}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          saveScore(player, isNaN(val) ? 0 : val);
                        }}
                        className="w-16 bg-slate-900 border border-slate-800 text-center font-display font-bold text-xl py-1 rounded-lg focus:outline-none focus:border-brand-500/50"
                      />
                    ) : (
                      <span className={`font-display font-bold text-2xl ${isWinner ? "text-brand-400" : "text-white"} ${isSaving ? "opacity-60" : ""}`}>
                        {score}
                      </span>
                    )}
                    {isSaving && <Loader2 className="w-3 h-3 animate-spin text-slate-500 inline ml-1" />}
                  </div>

                  {isActive && (
                    <button onClick={() => changeScore(player, 1)} className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-brand-950/20 border border-slate-800 hover:border-brand-900/30 text-slate-400 hover:text-brand-400 transition-all flex items-center justify-center cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  {!isActive && player.position && (
                    <span className="text-xs text-slate-400 font-semibold w-12 text-center">#{player.position}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Footer info */}
      <div className="glass-card p-4 border-slate-900 flex flex-wrap gap-4 text-xs text-slate-400">
        <span>{session.game_name}</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {new Date(session.started_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="capitalize">{session.mode.replace("_", " ")}</span>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGuestSessionStore } from "@/store/useGuestSessionStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useTimerStore } from "@/store/useTimerStore";
import type { Translations } from "@/translations";
import { FlashPicker } from "@/components/FlashPicker";
import {
  Clock,
  Trophy,
  Users,
  Flag,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  Dices,
  Timer,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";

function TimerPanel({ playerNames, t }: {
  playerNames: string[];
  t: Translations;
}) {
  const timer = useTimerStore();
  const [showSetup, setShowSetup] = useState(false);
  const [inputSeconds, setInputSeconds] = useState("60");
  const sessionId = "guest-local";
  const isMySession = timer.sessionId === sessionId;

  const handleSetup = () => {
    const secs = parseInt(inputSeconds, 10);
    if (!secs || secs < 5) return;
    timer.setupTimer(sessionId, playerNames.map((n, i) => ({ id: `g${i}`, name: n })), secs);
    setShowSetup(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const timeLeft = isMySession ? timer.timeLeft : 0;
  const pct = isMySession && timer.timeLimit > 0 ? (timeLeft / timer.timeLimit) * 100 : 100;
  const currentPlayer = isMySession ? timer.players[timer.currentIdx]?.name : "—";

  return (
    <div className="glass-card border-slate-800/60 flex flex-col gap-4">
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-sm text-white">{t.sessions.turnTimer}</span>
        </div>
        <button onClick={() => setShowSetup(!showSetup)} className="p-1.5 text-slate-500 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-all cursor-pointer">
          {showSetup ? <X className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showSetup && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <label className="text-xs text-slate-400">{t.sessions.timerLimitLabel}</label>
          <div className="flex gap-2">
            <input type="number" min={5} max={600} value={inputSeconds} onChange={(e) => setInputSeconds(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-500/50" />
            <button onClick={handleSetup} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl border border-brand-600/30 transition-all cursor-pointer">{t.common.confirm}</button>
          </div>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((s) => (
              <button key={s} onClick={() => setInputSeconds(s.toString())} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${inputSeconds === s.toString() ? "bg-brand-500/20 border-brand-500/30 text-brand-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>{s}s</button>
            ))}
          </div>
        </div>
      )}

      {!showSetup && isMySession && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          <p className="text-center text-sm"><span className="text-slate-400">{t.sessions.currentTurn} </span><strong className="text-white">{currentPlayer}</strong></p>
          <div className="relative flex items-center justify-center py-2">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke={timeLeft <= 10 ? "#ef4444" : "#8b5cf6"} strokeWidth="8" fill="none"
                strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <span className={`absolute font-mono font-bold text-2xl tabular-nums ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>{fmt(timeLeft)}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={timer.resetTurn} disabled={timer.status === "idle"} className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30" title={t.sessions.timerReset}><RotateCcw className="w-4 h-4" /></button>
            {timer.status === "idle" && <button onClick={timer.startTimer} className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold border border-brand-600/30 transition-all cursor-pointer text-sm flex items-center gap-2"><Play className="w-4 h-4" /> {t.sessions.timerStart}</button>}
            {timer.status === "running" && <button onClick={timer.pauseTimer} className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-all cursor-pointer text-sm flex items-center gap-2"><Pause className="w-4 h-4" /> {t.sessions.timerPause}</button>}
            {timer.status === "paused" && <button onClick={timer.resumeTimer} className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold border border-brand-600/30 transition-all cursor-pointer text-sm flex items-center gap-2"><Play className="w-4 h-4" /> {t.sessions.timerResume}</button>}
            <button onClick={timer.skipTurn} disabled={timer.status === "idle"} className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30" title={t.sessions.timerSkip}><SkipForward className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {!showSetup && !isMySession && (
        <p className="px-4 pb-4 text-center text-sm text-slate-500">{t.sessions.timerIdle}</p>
      )}
    </div>
  );
}

export default function GuestSessionPage() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { session, updateScore, finishSession, clearSession } = useGuestSessionStore();
  const [showFlash, setShowFlash] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // ── Clean up timer store if this guest session has finished ─────────────────
  useEffect(() => {
    if (session && session.status === "finished") {
      const timerState = useTimerStore.getState();
      if (timerState.sessionId === "guest-local") {
        timerState.clearTimer();
      }
    }
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center gap-6 text-center">
        <div className="p-5 bg-slate-900 rounded-full border border-slate-800 text-slate-500">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-display font-bold text-white">{t.sessions.noSessions}</h2>
        <Link href="/dashboard/sessions/new" className="bg-gradient-to-r from-brand-600 to-brand-700 text-white font-medium py-2.5 px-6 rounded-xl border border-brand-600/30 transition-all text-sm">
          {t.sessions.startNew}
        </Link>
      </div>
    );
  }

  const isActive = session.status === "active";
  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

  const handleFinish = () => {
    if (!confirm(`${t.sessions.finishSession}?`)) return;
    setFinishing(true);
    finishSession();
    setTimeout(() => setFinishing(false), 500);
  };

  const handleClear = () => {
    if (!confirm("Clear this session?")) return;
    clearSession();
    router.push("/dashboard/sessions");
  };

  const getDuration = () => {
    const start = new Date(session.started_at);
    const end = session.finished_at ? new Date(session.finished_at) : new Date();
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
      {showFlash && <FlashPicker players={session.players.map((p) => p.display_name)} onClose={() => setShowFlash(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-white">{session.game_name}</h1>
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${isActive ? "bg-brand-500/10 text-brand-400 border-brand-500/20" : "bg-slate-900 text-slate-400 border-slate-800"}`}>
              {isActive ? `● ${t.sessions.active}` : `✓ ${t.sessions.finished}`}
            </span>
          </div>
          <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {t.sessions.guestBannerDesc}
          </p>
        </div>
        {isActive && (
          <button onClick={handleFinish} disabled={finishing} className="shrink-0 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-medium py-2 px-4 rounded-xl border border-red-950/30 transition-all flex items-center gap-2 cursor-pointer text-xs">
            {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />} {t.sessions.finishSession}
          </button>
        )}
      </div>

      {/* Winner banner */}
      {!isActive && (
        <div className="glass-card p-5 border-brand-500/20 bg-brand-500/5 flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400"><Trophy className="w-6 h-6" /></div>
          <div>
            <p className="font-bold text-white text-sm">{t.sessions.sessionComplete}</p>
            <p className="text-xs text-slate-400 mt-0.5">🏆 {sortedPlayers[0]?.display_name} · {getDuration()}</p>
          </div>
        </div>
      )}

      {/* Register banner */}
      <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
        <p className="text-xs text-amber-400/80">{t.sessions.guestBannerDesc}</p>
        <Link href="/auth/register" className="shrink-0 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors">{t.sessions.registerToSave} →</Link>
      </div>

      {/* Toolbar */}
      {isActive && (
        <div className="flex gap-2">
          <button onClick={() => setShowFlash(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 text-purple-400 rounded-xl transition-all cursor-pointer text-sm font-medium">
            <Dices className="w-4 h-4" /> {t.sessions.flashBtn}
          </button>
        </div>
      )}

      {/* Timer */}
      {isActive && <TimerPanel playerNames={session.players.map((p) => p.display_name)} t={t} />}

      {/* Scoreboard */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" /> {t.sessions.scoreboard}
        </h2>
        {sortedPlayers.map((player, rank) => (
          <div key={player.id} className={`glass-card p-4 border transition-all ${!isActive && rank === 0 ? "border-brand-500/30 bg-brand-500/5" : "border-slate-800/60"}`}>
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border shrink-0 ${rank === 0 ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-white border-amber-500/30" : rank === 1 ? "bg-slate-700 text-slate-200 border-slate-600" : "bg-slate-900 text-slate-400 border-slate-800"}`}>
                {rank + 1}
              </div>
              <span className="font-semibold text-white text-sm flex-1">{player.display_name}</span>
              <div className="flex items-center gap-2">
                {isActive && (
                  <button onClick={() => updateScore(player.id, Math.max(0, player.score - 1))} className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                )}
                <span className={`font-display font-bold text-2xl min-w-[48px] text-center ${!isActive && rank === 0 ? "text-brand-400" : "text-white"}`}>{player.score}</span>
                {isActive && (
                  <button onClick={() => updateScore(player.id, player.score + 1)} className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-brand-950/20 border border-slate-800 hover:border-brand-900/30 text-slate-400 hover:text-brand-400 transition-all cursor-pointer flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Clear session */}
      {!isActive && (
        <button onClick={handleClear} className="w-full py-3 px-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all text-sm cursor-pointer">
          {t.common.delete} session
        </button>
      )}
    </div>
  );
}

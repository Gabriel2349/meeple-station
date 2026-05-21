"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  GameSession,
  SessionPlayer,
  SessionRepository,
} from "@/repositories/SessionRepository";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Clock,
  CheckCircle2,
  Plus,
  Minus,
  Flag,
  Gamepad2,
  AlertCircle,
  Users,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const { user, isLoading: isAuthLoading } = useRequireAuth(false);

  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Score update debounce map: playerId -> pending score
  const [pendingScores, setPendingScores] = useState<Record<string, number>>({});
  const [savingScores, setSavingScores] = useState<Record<string, boolean>>({});

  // Finish flow
  const [finishing, setFinishing] = useState(false);

  // Elapsed time display
  const [elapsed, setElapsed] = useState("0m");

  useEffect(() => {
    if (user && sessionId) loadSession();
  }, [user, sessionId, isAuthLoading]);

  // Live elapsed timer
  useEffect(() => {
    if (!session || session.status === "finished") return;
    const interval = setInterval(() => {
      const start = new Date(session.started_at);
      const mins = Math.round((Date.now() - start.getTime()) / 60000);
      setElapsed(mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
    }, 10000);
    // Set immediately
    const start = new Date(session.started_at);
    const mins = Math.round((Date.now() - start.getTime()) / 60000);
    setElapsed(mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
    return () => clearInterval(interval);
  }, [session]);

  const loadSession = async () => {
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
  };

  const getDisplayScore = (player: SessionPlayer) =>
    pendingScores[player.id] !== undefined ? pendingScores[player.id] : player.score;

  const changeScore = (player: SessionPlayer, delta: number) => {
    if (session?.status === "finished") return;
    const current = getDisplayScore(player);
    const next = Math.max(0, current + delta);
    setPendingScores((prev) => ({ ...prev, [player.id]: next }));
    // Debounce save
    setTimeout(() => saveScore(player.id, next), 600);
  };

  const saveScore = async (playerId: string, score: number) => {
    try {
      setSavingScores((prev) => ({ ...prev, [playerId]: true }));
      await SessionRepository.updateScore(playerId, score);
      // Sync player state
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, score } : p))
      );
      setPendingScores((prev) => {
        const copy = { ...prev };
        delete copy[playerId];
        return copy;
      });
    } catch (_) {
      /* silently ignore; retry on next change */
    } finally {
      setSavingScores((prev) => ({ ...prev, [playerId]: false }));
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    const confirmFinish = confirm(
      "Finish this session? Final scores will be recorded and the session will be locked."
    );
    if (!confirmFinish) return;

    try {
      setFinishing(true);
      // Rank players by score descending
      const sorted = [...players]
        .sort((a, b) => getDisplayScore(b) - getDisplayScore(a))
        .map((p, i) => ({ id: p.id, position: i + 1 }));

      await SessionRepository.finishSession(session.id, sorted);
      await loadSession();
    } catch (err: any) {
      alert(err.message || "Could not finish session.");
    } finally {
      setFinishing(false);
    }
  };

  const isOwner = user && session?.created_by === user.id;
  const isActive = session?.status === "active";

  const sortedPlayers = [...players].sort(
    (a, b) => getDisplayScore(b) - getDisplayScore(a)
  );

  const getDuration = () => {
    if (!session) return "—";
    const start = new Date(session.started_at);
    const end = session.finished_at ? new Date(session.finished_at) : new Date();
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (isAuthLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white min-h-screen text-center">
        <div className="glass-card p-8 max-w-md w-full flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold font-display">Session Not Found</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
          <Link
            href="/dashboard/sessions"
            className="mt-2 w-full py-2.5 px-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="w-full border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center sticky top-0 z-50">
        <Link
          href="/dashboard/sessions"
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all mr-4 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl text-white">
              {session.game_name}
            </h1>
            <span
              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                isActive
                  ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
            >
              {isActive ? "● Active" : "✓ Finished"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {isActive ? `Elapsed: ${elapsed}` : `Duration: ${getDuration()}`}
          </p>
        </div>

        {isOwner && isActive && (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="ml-auto bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-medium py-2 px-4 rounded-xl border border-red-950/30 hover:border-red-900/50 transition-all flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50"
          >
            {finishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            Finish Session
          </button>
        )}
      </nav>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Finished Banner */}
        {!isActive && (
          <div className="glass-card p-5 border-brand-500/20 bg-brand-500/5 flex items-center gap-4">
            <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20 text-brand-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Session Complete!</p>
              <p className="text-xs text-slate-400 mt-0.5">
                🏆 Winner:{" "}
                <strong className="text-brand-400">
                  {sortedPlayers[0]?.display_name}
                </strong>{" "}
                with {getDisplayScore(sortedPlayers[0])} pts · Duration: {getDuration()}
              </p>
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <section className="flex flex-col gap-3">
          <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Scoreboard
          </h2>

          {sortedPlayers.map((player, rank) => {
            const score = getDisplayScore(player);
            const isSaving = savingScores[player.id];
            const isWinner = !isActive && rank === 0;

            return (
              <div
                key={player.id}
                className={`glass-card p-4 border transition-all ${
                  isWinner
                    ? "border-brand-500/30 bg-brand-500/5"
                    : "border-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border shrink-0 ${
                      rank === 0
                        ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-white border-amber-500/30"
                        : rank === 1
                        ? "bg-slate-700 text-slate-200 border-slate-600"
                        : rank === 2
                        ? "bg-amber-950/40 text-amber-600 border-amber-900/30"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    {rank + 1}
                  </div>

                  {/* Name */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-white text-sm truncate">
                      {player.display_name}
                    </span>
                    {player.profile_id ? (
                      <span className="text-[9px] text-blue-400 uppercase tracking-wider">
                        Registered
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                        Guest
                      </span>
                    )}
                  </div>

                  {/* Score controls */}
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <button
                        onClick={() => changeScore(player, -1)}
                        className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/30 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}

                    <div className="min-w-[64px] text-center">
                      <span
                        className={`font-display font-bold text-2xl ${
                          isWinner ? "text-brand-400" : "text-white"
                        } ${isSaving ? "opacity-60" : ""}`}
                      >
                        {score}
                      </span>
                      {isSaving && (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-500 inline ml-1" />
                      )}
                    </div>

                    {isActive && (
                      <button
                        onClick={() => changeScore(player, 1)}
                        className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-brand-950/20 border border-slate-800 hover:border-brand-900/30 text-slate-400 hover:text-brand-400 transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}

                    {!isActive && player.position && (
                      <span className="text-xs text-slate-400 font-semibold w-12 text-center">
                        #{player.position}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Session Info footer */}
        <section className="glass-card p-4 border-slate-900 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-slate-500" />
            {session.game_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Started{" "}
            {new Date(session.started_at).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            Mode: {session.mode.replace("_", " ")}
          </span>
        </section>

        {isOwner && isActive && (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="sm:hidden w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 font-medium py-3 px-4 rounded-xl border border-red-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Flag className="w-4 h-4" />
            Finish Session
          </button>
        )}
      </main>
    </div>
  );
}

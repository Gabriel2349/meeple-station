"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useGuestSessionStore } from "@/store/useGuestSessionStore";
import { GameSession, SessionRepository } from "@/repositories/SessionRepository";
import type { Translations } from "@/translations";
import {
  Gamepad2,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  Trophy,
} from "lucide-react";

function SessionCard({
  session,
  t,
}: {
  session: GameSession;
  t: Translations;
}) {
  const players = session.session_players || [];
  const isActive = session.status === "active";

  const getDuration = () => {
    const start = new Date(session.started_at);
    const end = session.finished_at
      ? new Date(session.finished_at)
      : new Date();
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const winner = players.find((p) => p.position === 1)?.display_name;

  return (
    <Link
      href={`/dashboard/sessions/${session.id}`}
      className="glass-card p-5 border border-slate-800/80 hover:border-brand-500/20 transition-all flex flex-col gap-3 group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-display font-bold text-base text-white group-hover:text-brand-400 transition-colors">
            {session.game_name}
          </h3>
          <span className="text-xs text-slate-500">
            {new Date(session.started_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <span
          className={`shrink-0 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isActive
              ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}
        >
          {isActive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              {t.sessions.active}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              {t.sessions.finished}
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          {players.length}{" "}
          {players.length === 1 ? t.sessions.player : t.sessions.players}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {getDuration()}
        </span>
        {winner && !isActive && (
          <span className="flex items-center gap-1.5 text-brand-400">
            <Trophy className="w-3.5 h-3.5" />
            {winner}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {players.map((p) => (
          <span
            key={p.id}
            className="flex items-center gap-1.5 text-[11px] bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-slate-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500/60" />
            {p.display_name}
            {!isActive && p.score > 0 && (
              <span className="text-slate-500 ml-1">{p.score}pts</span>
            )}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function SessionsPage() {
  const { user, isGuest, isLoading: isAuthLoading } = useRequireAuth(true);
  const { t } = useLanguageStore();
  const guestStore = useGuestSessionStore();

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user) {
      fetchSessions();
    } else {
      // Guest — no remote sessions
      setLoading(false);
    }
  }, [user, isGuest, isAuthLoading]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await SessionRepository.getMySessions();
      setSessions(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not fetch sessions.");
    } finally {
      setLoading(false);
    }
  };

  const active = sessions.filter((s) => s.status === "active");
  const finished = sessions.filter((s) => s.status === "finished");

  if (isAuthLoading || (loading && user)) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            {t.sessions.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t.sessions.noSessionsDesc}
          </p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {t.sessions.newSession}
        </Link>
      </div>

      {errorMsg ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex flex-col items-center gap-2 text-center">
          <AlertCircle className="w-6 h-6" />
          <p className="text-sm font-semibold">{errorMsg}</p>
          <button
            onClick={fetchSessions}
            className="text-xs font-bold text-white bg-red-950/30 hover:bg-red-950/50 border border-red-800/30 rounded-lg px-3 py-1.5 transition-all"
          >
            {t.common.retry}
          </button>
        </div>
      ) : (
        <>
          {/* Guest active session */}
          {isGuest && guestStore.session && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <h2 className="font-display font-bold text-white text-lg">
                  {t.sessions.active}
                </h2>
              </div>
              <Link
                href="/dashboard/sessions/local"
                className="glass-card p-5 border border-brand-500/20 hover:border-brand-500/40 transition-all flex flex-col gap-3 group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-brand-400 transition-colors">
                    {guestStore.session.game_name}
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    {t.sessions.active}
                  </span>
                </div>
                <div className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5">
                  {t.sessions.guestBannerDesc}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {guestStore.session.players.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 text-[11px] bg-slate-900/60 border border-slate-800/80 rounded-lg px-2.5 py-1 text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500/60" />
                      {p.display_name}
                    </span>
                  ))}
                </div>
              </Link>
            </section>
          )}

          {/* Registered user: active sessions */}
          {active.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <h2 className="font-display font-bold text-white text-lg">
                  {t.sessions.active}
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {active.map((s) => (
                  <SessionCard key={s.id} session={s} t={t} />
                ))}
              </div>
            </section>
          )}

          {/* Finished sessions */}
          {finished.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
                {t.sessions.history}
              </h2>
              <div className="flex flex-col gap-3">
                {finished.map((s) => (
                  <SessionCard key={s.id} session={s} t={t} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {sessions.length === 0 && !guestStore.session && (
            <div className="glass-card p-14 text-center flex flex-col items-center gap-4 border-slate-900 mt-4">
              <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800 text-slate-500">
                <Gamepad2 className="w-10 h-10" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                {t.sessions.noSessions}
              </h3>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                {t.sessions.noSessionsDesc}
              </p>
              <Link
                href="/dashboard/sessions/new"
                className="mt-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium py-2.5 px-5 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all cursor-pointer text-sm"
              >
                {t.sessions.startNew}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

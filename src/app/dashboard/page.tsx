"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { SessionRepository } from "@/repositories/SessionRepository";
import {
  Gamepad2,
  Users,
  Library,
  Plus,
  Loader2,
  Trophy,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isGuest, isLoading } = useRequireAuth(true);
  const { guestName } = useAuthStore();
  const { t } = useLanguageStore();

  const [stats, setStats] = useState({
    matchesPlayed: 0,
    winRate: 0,
    timePlayedMin: 0,
    favoriteGame: "—",
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (isLoading || isGuest || !user) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const sessions = await SessionRepository.getMySessions();
        const finishedSessions = sessions.filter((s) => s.status === "finished");

        const matchesPlayed = finishedSessions.length;

        let wins = 0;
        let totalTimeMin = 0;
        const gameCounts: Record<string, number> = {};

        finishedSessions.forEach((s) => {
          // Check if user won
          const myPlayer = s.session_players?.find((p) => p.profile_id === user.id);
          if (myPlayer && myPlayer.position === 1) {
            wins++;
          }

          // Duration
          if (s.finished_at) {
            const durationMs = new Date(s.finished_at).getTime() - new Date(s.started_at).getTime();
            totalTimeMin += Math.round(durationMs / 60000);
          }

          // Count games
          const gameName = s.game_name || "—";
          gameCounts[gameName] = (gameCounts[gameName] || 0) + 1;
        });

        const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

        let favoriteGame = "—";
        let maxCount = 0;
        Object.entries(gameCounts).forEach(([game, count]) => {
          if (count > maxCount) {
            maxCount = count;
            favoriteGame = game;
          }
        });

        setStats({
          matchesPlayed,
          winRate,
          timePlayedMin: totalTimeMin,
          favoriteGame,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user, isGuest, isLoading]);

  const formatTimePlayed = (mins: number) => {
    if (mins === 0) return "0m";
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p className="mt-4 text-slate-400 font-medium animate-pulse">
          {t.common.loading}
        </p>
      </div>
    );
  }

  const displayName = isGuest ? guestName : user?.username;

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Welcome Banner */}
      <section className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            {t.dashboard.greeting}, {displayName}! 🎲
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold py-3 px-6 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {t.dashboard.newMatch}
        </Link>
      </section>

      {/* Dashboard Grid Modules */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sessions */}
        <Link
          href="/dashboard/sessions"
          className="glass-card p-6 flex flex-col gap-4 border border-slate-800/85 bg-slate-900/10 hover:bg-slate-900/20 hover:-translate-y-1 hover:border-brand-500/30 transition-all duration-300 group cursor-pointer shadow-lg shadow-slate-950/20 hover:shadow-brand-950/20"
        >
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20 w-fit group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-300">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-display text-white mt-2 group-hover:text-brand-400 transition-colors">
            {t.dashboard.sessionsTitle}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t.dashboard.sessionsDesc}
          </p>
          <div className="mt-auto pt-4 border-t border-slate-900 text-xs text-slate-500 group-hover:text-white transition-colors">
            {t.dashboard.viewSessions}
          </div>
        </Link>

        {/* Groups */}
        <Link
          href="/dashboard/groups"
          className="glass-card p-6 flex flex-col gap-4 border border-slate-800/85 bg-slate-900/10 hover:bg-slate-900/20 hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer shadow-lg shadow-slate-950/20 hover:shadow-blue-950/20"
        >
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 w-fit group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-display text-white mt-2 group-hover:text-blue-400 transition-colors">
            {t.dashboard.circlesTitle}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isGuest ? t.groups.guestBlocked : t.dashboard.circlesDesc}
          </p>
          <div className="mt-auto pt-4 border-t border-slate-900 text-xs text-slate-500 group-hover:text-white transition-colors">
            {t.dashboard.manageGroups}
          </div>
        </Link>

        {/* Library */}
        <div className="glass-card p-6 flex flex-col gap-4 border border-slate-850 bg-slate-950/40 opacity-40 cursor-not-allowed">
          <div className="p-3 bg-emerald-500/5 rounded-xl text-emerald-600 border border-emerald-950/30 w-fit">
            <Library className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-display text-slate-500 mt-2">
            {t.dashboard.libraryTitle}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {t.dashboard.libraryDesc}
          </p>
          <div className="mt-auto pt-4 border-t border-slate-900/60 text-xs text-slate-600">
            {t.common.comingSoon}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="glass-card p-6 flex flex-col gap-4 border border-slate-900">
        <div className="flex items-center gap-2 text-brand-400">
          <Trophy className="w-5 h-5" />
          <h3 className="font-bold text-sm uppercase tracking-wider">
            {t.dashboard.statsTitle}
          </h3>
        </div>
        {isGuest ? (
          <div className="mt-2 p-6 bg-brand-500/5 border border-brand-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-brand-500/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col gap-1 text-left">
              <h4 className="font-display font-bold text-white text-base">
                {t.dashboard.statsGuestTitle}
              </h4>
              <p className="text-slate-400 text-xs max-w-md">
                {t.dashboard.statsGuestWarning}
              </p>
            </div>
            <Link
              href="/auth/register"
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl border border-brand-600/30 transition-all text-center whitespace-nowrap cursor-pointer shadow-md shadow-brand-950/20"
            >
              {t.auth.register} →
            </Link>
          </div>
        ) : statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-2">
            {[
              { val: stats.matchesPlayed.toString(), label: t.dashboard.matchesPlayed },
              { val: `${stats.winRate}%`, label: t.dashboard.winRate },
              { val: formatTimePlayed(stats.timePlayedMin), label: t.dashboard.timePlayed },
              { val: stats.favoriteGame, label: t.dashboard.favoriteGame },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-900/30 border border-slate-900/80 rounded-xl p-4"
              >
                <span className="block text-xl md:text-2xl font-bold font-display text-white truncate max-w-full px-1" title={s.val}>
                  {s.val}
                </span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

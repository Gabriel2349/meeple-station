"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Dices,
  Users,
  Library,
  Gamepad2,
  LogOut,
  Plus,
  Loader2,
  Trophy,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isGuest, isLoading } = useRequireAuth(true);
  const { guestName, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p className="mt-4 text-slate-400 font-medium animate-pulse">
          Loading session...
        </p>
      </div>
    );
  }

  const displayName = isGuest ? guestName : user?.username;
  const initial = displayName?.charAt(0).toUpperCase() || "M";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Top Navbar */}
      <nav className="w-full border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20">
            <Dices className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            MeepleStation
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl py-1.5 pl-3 pr-1.5">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-white leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {isGuest ? "Guest Player" : "Collector"}
              </span>
            </div>
            {isGuest ? (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold">
                {initial}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white font-bold border border-brand-500/30">
                {initial}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-3 bg-slate-900/50 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-950/30 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Dashboard Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Welcome Banner */}
        <section className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
              Good gaming, {displayName}! 🎲
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
              Ready to roll some dice? Create a new match lobby, invite your
              friends, or browse your BoardGameGeek collection.
            </p>
          </div>

          <Link
            href="/dashboard/sessions/new"
            className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold py-3 px-6 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Match
          </Link>
        </section>

        {/* Dashboard Grid Modules */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sessions Panel */}
          <Link
            href="/dashboard/sessions"
            className="glass-card p-6 flex flex-col gap-4 border border-slate-800/80 hover:border-brand-500/20 transition-all group cursor-pointer"
          >
            <div className="p-3 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20 w-fit">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-white mt-2 group-hover:text-brand-400 transition-colors">
              Game Sessions
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track real-time scores, multi-player timers, and play history on
              the table.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-900 text-xs text-slate-500">
              View sessions →
            </div>
          </Link>

          {/* Groups Panel */}
          <Link
            href="/dashboard/groups"
            className="glass-card p-6 flex flex-col gap-4 border border-slate-800/80 hover:border-brand-500/20 transition-all group cursor-pointer text-left"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-white mt-2 group-hover:text-blue-400 transition-colors">
              Gaming Circles
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create playing groups, view leaderboards, and aggregate historical
              stats.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-900 text-xs text-slate-500">
              Manage groups →
            </div>
          </Link>

          {/* Ludoteca Panel */}
          <div className="glass-card p-6 flex flex-col gap-4 border border-slate-800/80 hover:border-brand-500/20 transition-all group">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 w-fit">
              <Library className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display text-white mt-2 group-hover:text-emerald-400 transition-colors">
              Ludoteca (BGG)
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Import and manage your board game library directly from
              BoardGameGeek.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-900 text-xs text-slate-500">
              Coming soon
            </div>
          </div>
        </section>

        {/* Quick Stats Placeholder */}
        <section className="glass-card p-6 flex flex-col gap-4 border border-slate-900">
          <div className="flex items-center gap-2 text-brand-400">
            <Trophy className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">
              Stats Overview
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-2">
            <div className="bg-slate-900/30 border border-slate-900/80 rounded-xl p-4">
              <span className="block text-2xl font-bold font-display text-white">
                0
              </span>
              <span className="text-xs text-slate-400">Matches Played</span>
            </div>
            <div className="bg-slate-900/30 border border-slate-900/80 rounded-xl p-4">
              <span className="block text-2xl font-bold font-display text-white">
                0%
              </span>
              <span className="text-xs text-slate-400">Win Rate</span>
            </div>
            <div className="bg-slate-900/30 border border-slate-900/80 rounded-xl p-4">
              <span className="block text-2xl font-bold font-display text-white">
                0h
              </span>
              <span className="text-xs text-slate-400">Time Played</span>
            </div>
            <div className="bg-slate-900/30 border border-slate-900/80 rounded-xl p-4">
              <span className="block text-2xl font-bold font-display text-white">
                --
              </span>
              <span className="text-xs text-slate-400">Favorite Game</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

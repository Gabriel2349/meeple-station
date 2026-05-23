"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { 
  Dices, 
  Users, 
  Library, 
  Clock, 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  LogOut, 
  Gamepad2, 
  Trophy 
} from "lucide-react";

export default function Home() {
  const { user, isGuest, guestName, checkSession, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const displayName = isGuest ? guestName : user?.username;
  const isAuthenticated = !!user || isGuest;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 overflow-x-hidden">
      
      {/* Top Navbar */}
      <nav className="w-full border-b border-slate-900/60 bg-slate-950/40 backdrop-blur-md px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20">
            <Dices className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            MeepleStation
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
            className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {language === "es" ? "EN" : "ES"}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">
                {language === "es" ? "Jugando como " : "Playing as "}<strong className="text-slate-200">{displayName}</strong>
              </span>
              <Link 
                href="/dashboard"
                className="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-md transition-all flex items-center gap-1.5"
              >
                {t.landing.dashboardBtn}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => logout()}
                title={t.auth.logout}
                className="p-2.5 bg-slate-900 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-850 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/auth/login"
                className="py-2 px-3 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                {t.landing.loginBtn}
              </Link>
              <Link 
                href="/auth/register"
                className="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-md transition-all"
              >
                {t.landing.registerBtn}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-12 flex flex-col items-center text-center gap-6 z-10">
        {/* Glow decoration */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          {t.landing.heroBadge}
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight max-w-3xl leading-none">
          {t.landing.heroTitle}<span className="bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">{t.landing.heroTitleHighlight}</span>
        </h1>
        
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          {t.landing.heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link 
              href="/dashboard"
              className="py-3.5 px-8 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {t.landing.dashboardBtn}
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link 
                href="/auth/register"
                className="py-3.5 px-8 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {t.landing.startFreeBtn}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/auth/guest"
                className="py-3.5 px-8 bg-slate-900/50 hover:bg-slate-800 text-slate-300 border border-slate-850 hover:border-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                {t.landing.playGuestBtn}
              </Link>
            </>
          )}
        </div>

        {/* Dashboard visual mockup */}
        <div className="w-full mt-12 glass-card p-4 border-slate-900/80 shadow-2xl relative">
          <div className="absolute -inset-1 bg-gradient-to-b from-brand-500/10 to-transparent rounded-2xl blur-xl -z-10 pointer-events-none" />
          {/* Mockup Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-900">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/60" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <span className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t.landing.previewTitle}</span>
            <div className="w-10" />
          </div>
          {/* Mockup Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-white">{t.landing.previewActive}</span>
              <span className="text-[10px] text-slate-500">Ark Nova — Turn 12</span>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mt-1">
                <div className="h-full w-2/3 bg-brand-500 rounded-full" />
              </div>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-white">{t.landing.previewGroup}</span>
              <span className="text-[10px] text-slate-500">Friday Boardgame Night</span>
              <div className="flex -space-x-2 mt-1">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-950 flex items-center justify-center text-[7px] font-bold">A</span>
                <span className="w-5 h-5 rounded-full bg-slate-700 border border-slate-950 flex items-center justify-center text-[7px] font-bold">B</span>
                <span className="w-5 h-5 rounded-full bg-slate-600 border border-slate-950 flex items-center justify-center text-[7px] font-bold">C</span>
              </div>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Library className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-white">{t.landing.previewBgg}</span>
              <span className="text-[10px] text-slate-500">42 Games Imported</span>
              <div className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 mt-1 w-fit">
                {t.landing.previewBggStatus}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="w-full border-t border-slate-900/80 bg-slate-900/20 py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-12">
          <div className="text-center flex flex-col gap-3">
            <h2 className="text-3xl font-display font-bold text-white tracking-tight">
              {t.landing.featuresTitle}
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              {t.landing.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feat 1 */}
            <div className="glass-card p-6 border-slate-900/80 flex flex-col gap-4">
              <div className="p-3 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20 w-fit">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-white">
                {t.landing.feat1Title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.landing.feat1Desc}
              </p>
            </div>

            {/* Feat 2 */}
            <div className="glass-card p-6 border-slate-900/80 flex flex-col gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-white">
                {t.landing.feat2Title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.landing.feat2Desc}
              </p>
            </div>

            {/* Feat 3 */}
            <div className="glass-card p-6 border-slate-900/80 flex flex-col gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 w-fit">
                <Library className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-white">
                {t.landing.feat3Title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.landing.feat3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Block */}
      <section className="w-full py-16 px-6 border-t border-slate-900/80 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col gap-1">
            <span className="text-3xl md:text-4xl font-extrabold font-display text-brand-500">{t.landing.statFree}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl md:text-4xl font-extrabold font-display text-blue-400">{t.landing.statPwa}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl md:text-4xl font-extrabold font-display text-emerald-400">{t.landing.statOffline}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl md:text-4xl font-extrabold font-display text-purple-400">{t.landing.statBgg}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/60 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p>{t.landing.footerText}</p>
      </footer>

    </div>
  );
}

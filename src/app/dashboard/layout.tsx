"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { BottomNav } from "@/components/BottomNav";
import { Dices, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, guestName, isGuest, _hasHydrated, checkSession, logout } =
    useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const displayName = isGuest ? guestName : user?.username;
  const initial = displayName?.charAt(0).toUpperCase() || "M";

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* ── SHARED TOP NAVBAR ── */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-md shadow-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 bg-brand-500/10 rounded-xl text-brand-500 border border-brand-500/20">
              <Dices className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white hidden sm:block">
              MeepleStation
            </span>
          </Link>

          {/* Desktop nav tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: t.nav.home, href: "/dashboard" },
              { label: t.nav.sessions, href: "/dashboard/sessions" },
              { label: t.nav.circles, href: "/dashboard/groups" },
              { label: t.nav.library, href: "#", disabled: true },
            ].map((item) => {
              const disabled = item.disabled;
              if (disabled) {
                return (
                  <span
                    key={item.label}
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl cursor-not-allowed"
                  >
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: user info + lang + logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {language === "es" ? "EN" : "ES"}
            </button>

            {/* User pill */}
            {displayName && (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl py-1.5 pl-2.5 pr-1.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                    {isGuest ? t.auth.guestPlayer : t.auth.collector}
                  </span>
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border ${
                    isGuest
                      ? "bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-gradient-to-tr from-brand-600 to-brand-500 border-brand-500/30 text-white"
                  }`}
                >
                  {initial}
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              title={t.auth.logout}
              className="p-2 bg-slate-900/50 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-950/30 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className="flex-1 pb-24 md:pb-8">{children}</main>

      {/* ── BOTTOM TAB NAV (mobile + desktop) ── */}
      <BottomNav />
    </div>
  );
}

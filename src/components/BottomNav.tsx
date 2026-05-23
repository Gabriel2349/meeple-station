"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Users, Library } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTimerStore } from "@/store/useTimerStore";

const tabs = [
  { key: "home", href: "/dashboard", icon: Home, exact: true },
  { key: "sessions", href: "/dashboard/sessions", icon: Gamepad2 },
  { key: "circles", href: "/dashboard/groups", icon: Users },
  { key: "library", href: "/dashboard/library", icon: Library, disabled: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguageStore();
  const { isGuest } = useAuthStore();
  const { status: timerStatus, timeLeft, players, currentIdx } = useTimerStore();
  const timerRunning = timerStatus === "running" || timerStatus === "paused";

  const isActive = (tab: (typeof tabs)[number]) => {
    if ("exact" in tab && tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  const navLabels: Record<string, string> = {
    home: t.nav.home,
    sessions: t.nav.sessions,
    circles: t.nav.circles,
    library: t.nav.library,
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 safe-area-bottom">
      {/* Timer indicator bar */}
      {timerRunning && (
        <div className="w-full px-4 py-1.5 bg-brand-950/40 border-b border-brand-900/30 flex items-center justify-between text-xs">
          <span className="text-brand-400 font-semibold">
            {t.sessions.currentTurn}{" "}
            <span className="text-white">{players[currentIdx]?.name}</span>
          </span>
          <span
            className={`font-mono font-bold tabular-nums ${
              timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-brand-400"
            }`}
          >
            {Math.floor(timeLeft / 60)
              .toString()
              .padStart(2, "0")}
            :{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const disabled = "disabled" in tab && tab.disabled;

          if (disabled) {
            return (
              <button
                key={tab.key}
                disabled
                className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl opacity-30 cursor-not-allowed"
              >
                <Icon className="w-5 h-5 text-slate-500" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  {navLabels[tab.key]}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
                active
                  ? "text-brand-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all ${
                    active ? "scale-110" : ""
                  }`}
                />
                {/* Active dot */}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />
                )}
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider ${
                  active ? "text-brand-400" : "text-slate-500"
                }`}
              >
                {navLabels[tab.key]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { Dices } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isGuest, checkSession } = useAuthStore();

  useEffect(() => {
    // Check session on load
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // If already authenticated (user profile or guest), skip landing page
    if (user || isGuest) {
      router.push("/dashboard");
    }
  }, [user, isGuest, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-card p-10 max-w-lg w-full flex flex-col items-center gap-6">
        <div className="p-4 bg-brand-500/10 rounded-2xl text-brand-500 border border-brand-500/20">
          <Dices className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-500 tracking-tight">
          MeepleStation
        </h1>
        <p className="text-slate-400 text-lg max-w-md">
          The all-in-one tabletop companion app for tracking scores, timers, and game history.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full">
          <Link 
            href="/auth/login"
            className="flex-1 py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center cursor-pointer"
          >
            Login
          </Link>
          <Link 
            href="/auth/guest"
            className="flex-1 py-3.5 px-4 bg-slate-900/50 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 font-medium rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            Play as Guest
          </Link>
        </div>
      </div>
    </main>
  );
}

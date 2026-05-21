"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { User, ArrowRight, ArrowLeft, Dices } from "lucide-react";

export default function GuestPage() {
  const router = useRouter();
  const setGuest = useAuthStore((state) => state.setGuest);
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartGuest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMsg("Guest name must be at least 2 characters long.");
      return;
    }

    if (trimmedName.length > 20) {
      setErrorMsg("Guest name must be less than 20 characters.");
      return;
    }

    setGuest(trimmedName);
    router.push("/dashboard");
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500 border border-brand-500/20">
          <Dices className="w-8 h-8" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white mt-2">
          Play as Guest
        </h1>
        <p className="text-sm text-slate-400">
          Set a nickname to start tracking scores instantly
        </p>
      </div>

      <form onSubmit={handleStartGuest} className="flex flex-col gap-4 mt-2 text-left">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Choose a Nickname
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              required
              maxLength={20}
              placeholder="Player 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium py-3 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Start Playing
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="flex flex-col gap-4 mt-2">
        <p className="text-sm text-slate-400">
          Want a permanent account?{" "}
          <Link
            href="/auth/register"
            className="text-brand-500 hover:underline font-medium"
          >
            Sign Up here
          </Link>
        </p>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </>
  );
}

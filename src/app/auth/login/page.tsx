"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { useAuthStore } from "@/store/useAuthStore";
import { Dices, KeyRound, Mail, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          throw new Error("Could not load user profile. Make sure the profile sync trigger was run.");
        }

        setUser(profile);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500 border border-brand-500/20">
          <Dices className="w-8 h-8" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white mt-2">
          Welcome Back
        </h1>
        <p className="text-sm text-slate-400">
          Sign in to your MeepleStation account
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2 text-left">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
          disabled={loading}
          className="mt-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-medium py-3 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="flex flex-col gap-4 mt-2">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            className="text-brand-500 hover:underline font-medium"
          >
            Create one
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

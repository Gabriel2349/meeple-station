"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { User, Mail, KeyRound, Loader2, ArrowLeft, Dices } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic validation
    if (username.trim().length < 3) {
      setErrorMsg("Username must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        // If auto-confirm is enabled in Supabase, we can log them in or redirect them.
        // Check if session is active
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.push("/dashboard");
        } else {
          setSuccessMsg("Registration successful! Please check your email to confirm your account.");
          // Clear inputs
          setUsername("");
          setEmail("");
          setPassword("");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during registration.");
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
          Create Account
        </h1>
        <p className="text-sm text-slate-400">
          Join MeepleStation and start tracking games
        </p>
      </div>

      {successMsg ? (
        <div className="flex flex-col gap-4 mt-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 text-center font-medium">
            {successMsg}
          </div>
          <Link
            href="/auth/login"
            className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium py-3 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center justify-center cursor-pointer"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-2 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                placeholder="meeple_king"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

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
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      )}

      {!successMsg && (
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-brand-500 hover:underline font-medium"
            >
              Sign In
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
      )}
    </>
  );
}

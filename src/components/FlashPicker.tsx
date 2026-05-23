"use client";

import { useState, useEffect } from "react";
import { Dices, Trophy } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";

interface FlashPickerProps {
  players: string[];
  onClose: () => void;
}

export function FlashPicker({ players, onClose }: FlashPickerProps) {
  const { t } = useLanguageStore();
  const [phase, setPhase] = useState<"picking" | "result">("picking");
  const [highlighted, setHighlighted] = useState(0);
  const [winner, setWinner] = useState<string>("");

  useEffect(() => {
    if (players.length === 0) return;

    // 1. Choose winner index
    const winnerIdx = Math.floor(Math.random() * players.length);
    // 2. We want to do 3 full spins + land on the winner
    const spins = 3;
    const totalSteps = players.length * spins + winnerIdx;

    let currentStep = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      setHighlighted(currentStep % players.length);

      if (currentStep >= totalSteps) {
        setWinner(players[winnerIdx]);
        setPhase("result");
        return;
      }

      currentStep++;
      
      // Decelerate using an ease-out curve (quadratic/cubic)
      // Progress goes from 0 to 1
      const progress = currentStep / totalSteps;
      const delay = 40 + 360 * Math.pow(progress, 3); // Fast 40ms -> Slow 400ms

      timeoutId = setTimeout(tick, delay);
    };

    // Kick off animation
    timeoutId = setTimeout(tick, 40);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [players]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={phase === "result" ? onClose : undefined}
    >
      <div 
        className="glass-card w-full max-w-sm border-slate-800/80 bg-slate-950/95 p-8 flex flex-col items-center gap-6 text-center shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking card
      >
        {/* Background glow decorative details */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

        {/* Icon */}
        <div className={`p-4 rounded-2xl border transition-all duration-500 ${
          phase === "picking" 
            ? "bg-brand-500/10 border-brand-500/20 text-brand-400 animate-pulse" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-400 scale-110 shadow-lg shadow-amber-500/20"
        }`}>
          {phase === "picking" ? (
            <Dices className="w-10 h-10 animate-spin" style={{ animationDuration: "0.6s" }} />
          ) : (
            <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          )}
        </div>

        <div>
          <h2 className="font-display font-bold text-2xl text-white tracking-tight animate-fade-in">
            {phase === "picking" ? t.sessions.flashTitle : t.sessions.flashResult}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {phase === "picking" 
              ? "Selecting starting player..." 
              : "Decided by fate! Good luck!"}
          </p>
        </div>

        {/* Player grid */}
        <div className="w-full flex flex-col gap-2.5 my-2">
          {players.map((name, idx) => {
            const isHighlighted = highlighted === idx;
            const isWinner = phase === "result" && highlighted === idx;

            return (
              <div
                key={idx}
                className={`w-full py-3.5 px-5 rounded-xl border font-bold text-base font-display transition-all duration-150 flex items-center justify-between ${
                  isWinner
                    ? "bg-gradient-to-r from-amber-500 via-brand-500 to-purple-600 border-amber-400/40 text-white scale-[1.04] shadow-xl shadow-brand-500/20"
                    : isHighlighted
                    ? "bg-brand-600/20 border-brand-500/50 text-white scale-[1.02] shadow-md shadow-brand-950/30"
                    : "bg-slate-900/40 border-slate-900 text-slate-500 opacity-40"
                }`}
              >
                <span>{name}</span>
                {isWinner && (
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md animate-pulse">
                    1st
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Result state */}
        {phase === "result" && (
          <div className="flex flex-col items-center gap-3 mt-2 w-full animate-fade-in">
            <p className="text-slate-300 text-sm leading-relaxed">
              🎲 <strong className="text-amber-400 font-bold">{winner}</strong> {t.sessions.flashResult}!
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold rounded-xl border border-brand-500/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all cursor-pointer text-sm"
            >
              ¡A jugar!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

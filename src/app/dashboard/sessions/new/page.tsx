"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { GroupRepository, Group } from "@/repositories/GroupRepository";
import { SessionRepository, SessionMode } from "@/repositories/SessionRepository";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Users,
  Gamepad2,
  UserPlus,
  X,
  Check,
  Shuffle,
  ChevronDown,
} from "lucide-react";

interface Player {
  profile_id?: string;
  display_name: string;
  isFromGroup?: boolean;
  selected?: boolean;
}

const MODE_INFO = {
  closed_group: {
    label: "Closed Group",
    description: "Load all members of a gaming circle automatically.",
    icon: Users,
    color: "blue",
  },
  hybrid: {
    label: "Hybrid Group",
    description: "Load a group, deselect absent players, add extra guests.",
    icon: Shuffle,
    color: "purple",
  },
  casual: {
    label: "Casual / No Group",
    description: "Add any players manually. No group needed.",
    icon: UserPlus,
    color: "brand",
  },
} as const;

export default function NewSessionPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth(false);

  // ── Step tracking ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Mode, 2=Players, 3=Game

  // ── Step 1: Mode ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<SessionMode>("casual");

  // ── Step 2: Players ───────────────────────────────────────────────────────
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);

  // ── Step 3: Game ──────────────────────────────────────────────────────────
  const [gameName, setGameName] = useState("");
  const [gameError, setGameError] = useState<string | null>(null);

  // ── Create ─────────────────────────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch groups when user is loaded and mode needs groups
  useEffect(() => {
    if (user && (mode === "closed_group" || mode === "hybrid")) {
      fetchGroups();
    }
  }, [user, mode]);

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const data = await GroupRepository.getGroups();
      setGroups(data);
    } catch (_) {
      /* non-critical */
    } finally {
      setGroupsLoading(false);
    }
  };

  // Load group members when group is selected
  const handleGroupSelect = async (groupId: string) => {
    setSelectedGroupId(groupId);
    if (!groupId) {
      setPlayers([]);
      return;
    }
    try {
      const details = await GroupRepository.getGroupDetails(groupId);
      const groupPlayers: Player[] = details.members.map((m) => ({
        profile_id: m.profile.id,
        display_name: m.profile.username,
        isFromGroup: true,
        selected: true, // pre-selected for closed/hybrid
      }));
      setPlayers(groupPlayers);
    } catch (_) {
      setPlayers([]);
    }
  };

  const togglePlayer = (idx: number) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p))
    );
  };

  const addManualPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.some((p) => p.display_name.toLowerCase() === name.toLowerCase())) {
      setAddPlayerError("A player with that name already exists.");
      return;
    }
    setAddPlayerError(null);
    setPlayers((prev) => [...prev, { display_name: name, selected: true }]);
    setNewPlayerName("");
  };

  const removePlayer = (idx: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== idx));
  };

  const activePlayers = players.filter(
    (p) => mode === "casual" || p.selected !== false
  );

  // ── Navigation guards ──────────────────────────────────────────────────────
  const canGoToStep2 = true; // mode is always selected
  const canGoToStep3 = activePlayers.length >= 1;
  const canCreate = gameName.trim().length >= 1 && activePlayers.length >= 1;

  const handleCreate = async () => {
    if (!user || !canCreate) return;
    try {
      setCreating(true);
      setCreateError(null);
      const session = await SessionRepository.createSession({
        game_name: gameName.trim(),
        mode,
        group_id: selectedGroupId || undefined,
        created_by: user.id,
        players: activePlayers.map((p) => ({
          profile_id: p.profile_id,
          display_name: p.display_name,
        })),
      });
      router.push(`/dashboard/sessions/${session.id}`);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create session.");
    } finally {
      setCreating(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="w-full border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center sticky top-0 z-50">
        <Link
          href="/dashboard/sessions"
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all mr-4 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-brand-400" />
          <span className="font-display font-bold text-xl tracking-tight text-white">
            New Game Session
          </span>
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="w-full max-w-2xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Mode" },
            { n: 2, label: "Players" },
            { n: 3, label: "Game" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${
                    step === n
                      ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-950/20"
                      : step > n
                      ? "bg-brand-500/20 border-brand-500/30 text-brand-400"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                >
                  {step > n ? <Check className="w-4 h-4" /> : n}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block ${
                    step >= n ? "text-white" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    step > n ? "bg-brand-500/30" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── STEP 1: Mode Selection ── */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Choose Game Mode
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                How do you want to set up the players for this session?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {(Object.entries(MODE_INFO) as [SessionMode, typeof MODE_INFO[SessionMode]][]).map(
                ([key, info]) => {
                  const Icon = info.icon;
                  const isSelected = mode === key;
                  const colorMap: Record<string, string> = {
                    blue: "border-blue-500/40 bg-blue-500/5",
                    purple: "border-purple-500/40 bg-purple-500/5",
                    brand: "border-brand-500/40 bg-brand-500/5",
                  };
                  const iconColor: Record<string, string> = {
                    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                    brand: "text-brand-400 bg-brand-500/10 border-brand-500/20",
                  };
                  return (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`glass-card p-5 flex items-center gap-4 text-left transition-all cursor-pointer border ${
                        isSelected
                          ? colorMap[info.color]
                          : "border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl border ${
                          isSelected
                            ? iconColor[info.color]
                            : "text-slate-500 bg-slate-900 border-slate-800"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span
                          className={`font-bold font-display text-base ${
                            isSelected ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {info.label}
                        </span>
                        <span className="text-xs text-slate-400 leading-relaxed">
                          {info.description}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-brand-500 bg-brand-500"
                            : "border-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2}
              className="mt-auto w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold py-3.5 px-6 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Next: Set Up Players
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* ── STEP 2: Players ── */}
        {step === 2 && (
          <>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Set Up Players
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {mode === "closed_group" && "Select your gaming circle to load all members."}
                {mode === "hybrid" && "Select a circle, deselect absent players, and add extra guests."}
                {mode === "casual" && "Add players manually by name. No account needed."}
              </p>
            </div>

            {/* Group selector for closed/hybrid */}
            {(mode === "closed_group" || mode === "hybrid") && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Gaming Circle
                </label>
                {groupsLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading circles...
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    You don&apos;t have any circles yet.{" "}
                    <Link href="/dashboard/groups" className="text-brand-400 underline">
                      Create one first.
                    </Link>
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => handleGroupSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer text-sm"
                    >
                      <option value="">-- Choose a circle --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.member_count} members)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            {/* Player list */}
            {players.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Players{" "}
                  <span className="text-slate-500 normal-case font-normal">
                    ({activePlayers.length} active)
                  </span>
                </label>
                <div className="flex flex-col gap-2">
                  {players.map((p, idx) => {
                    const isActive = mode === "casual" || p.selected !== false;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isActive
                            ? "bg-slate-900/40 border-slate-800"
                            : "bg-slate-950/30 border-slate-900/60 opacity-50"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${
                            p.isFromGroup
                              ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white border-blue-500/20"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {p.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-white">
                          {p.display_name}
                          {p.isFromGroup && (
                            <span className="ml-2 text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider">
                              Circle
                            </span>
                          )}
                        </span>

                        {/* Hybrid toggle */}
                        {mode === "hybrid" && p.isFromGroup && (
                          <button
                            onClick={() => togglePlayer(idx)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                              p.selected
                                ? "bg-brand-500/20 border-brand-500/30 text-brand-400"
                                : "bg-slate-900 border-slate-800 text-slate-500"
                            }`}
                          >
                            {p.selected ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Remove manual players */}
                        {!p.isFromGroup && (
                          <button
                            onClick={() => removePlayer(idx)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-900/30 hover:bg-red-950/20 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add manual player (always available, required for casual) */}
            {(mode === "casual" || mode === "hybrid") && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {mode === "hybrid" ? "Add Extra Guest" : "Add Player"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter player name..."
                    value={newPlayerName}
                    onChange={(e) => {
                      setNewPlayerName(e.target.value);
                      setAddPlayerError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && addManualPlayer()}
                    maxLength={30}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                  <button
                    onClick={addManualPlayer}
                    disabled={!newPlayerName.trim()}
                    className="px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
                {addPlayerError && (
                  <p className="text-xs text-red-400">{addPlayerError}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canGoToStep3}
                className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-white font-semibold py-3 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                Next: Choose Game
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Game ── */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Choose a Game
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Enter the board game you&apos;ll be playing today.
              </p>
            </div>

            {/* Summary */}
            <div className="glass-card p-4 border-slate-900 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Session Summary
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
                  {MODE_INFO[mode].label}
                </span>
                {activePlayers.map((p, i) => (
                  <span
                    key={i}
                    className="text-xs bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-slate-300 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500/60" />
                    {p.display_name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Game Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ark Nova, Catan, Wingspan..."
                value={gameName}
                onChange={(e) => {
                  setGameName(e.target.value);
                  setGameError(null);
                }}
                maxLength={80}
                autoFocus
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 px-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/10 transition-all"
              />
              {gameError && (
                <p className="text-xs text-red-400">{gameError}</p>
              )}
            </div>

            {createError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium">
                {createError}
              </div>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!canCreate || creating}
                className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-white font-semibold py-3 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4" />
                    Start Session
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

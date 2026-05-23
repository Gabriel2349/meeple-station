"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useGuestSessionStore } from "@/store/useGuestSessionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/utils/supabaseClient";
import { GroupRepository, Group } from "@/repositories/GroupRepository";
import { SessionRepository, SessionMode } from "@/repositories/SessionRepository";
import {
  ArrowRight,
  Loader2,
  Users,
  UserPlus,
  X,
  Check,
  Shuffle,
  ChevronDown,
  Search,
} from "lucide-react";

interface Player {
  profile_id?: string;
  display_name: string;
  isFromGroup?: boolean;
  selected?: boolean;
  isRegistered?: boolean;
}

interface UserSearchResult {
  id: string;
  username: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const { user, isGuest, isLoading: isAuthLoading } = useRequireAuth(true);
  const { t } = useLanguageStore();
  const guestStore = useGuestSessionStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<SessionMode>("casual");

  // Players
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [guestName, setGuestName] = useState("");
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);

  // Registered user search
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  // Game
  const [gameName, setGameName] = useState("");

  // Create
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // For guests, only casual mode is available
  const availableModes = isGuest
    ? (["casual"] as SessionMode[])
    : (["closed_group", "hybrid", "casual"] as SessionMode[]);

  useEffect(() => {
    if (isGuest) setMode("casual");
  }, [isGuest]);

  useEffect(() => {
    if (user && (mode === "closed_group" || mode === "hybrid")) fetchGroups();
  }, [user, mode]);

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const data = await GroupRepository.getGroups();
      setGroups(data);
    } catch (_) {}
    finally { setGroupsLoading(false); }
  };

  const handleGroupSelect = async (groupId: string) => {
    setSelectedGroupId(groupId);
    if (!groupId) { setPlayers([]); return; }
    try {
      const details = await GroupRepository.getGroupDetails(groupId);
      setPlayers(
        details.members.map((m) => ({
          profile_id: m.profile.id,
          display_name: m.profile.username,
          isFromGroup: true,
          selected: true,
          isRegistered: true,
        }))
      );
    } catch (_) { setPlayers([]); }
  };

  const togglePlayer = (idx: number) =>
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p))
    );

  const addGuestPlayer = () => {
    const name = guestName.trim();
    if (!name) return;
    if (players.some((p) => p.display_name.toLowerCase() === name.toLowerCase())) {
      setAddPlayerError(t.sessions.playerExists);
      return;
    }
    setAddPlayerError(null);
    setPlayers((prev) => [...prev, { display_name: name, selected: true }]);
    setGuestName("");
  };

  const searchUsers = async () => {
    const term = userSearch.trim();
    if (!term) return;
    try {
      setUserSearchLoading(true);
      setUserSearchError(null);
      setUserResults([]);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${term}%`)
        .limit(5);
      if (error) throw error;
      const filtered = (data || []).filter(
        (u) =>
          u.id !== user?.id &&
          !players.some((p) => p.profile_id === u.id)
      );
      if (filtered.length === 0) setUserSearchError(t.sessions.userNotFound);
      setUserResults(filtered);
    } catch (_) {
      setUserSearchError(t.sessions.userNotFound);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const addRegisteredPlayer = (u: UserSearchResult) => {
    if (players.some((p) => p.profile_id === u.id)) return;
    setPlayers((prev) => [
      ...prev,
      {
        profile_id: u.id,
        display_name: u.username,
        selected: true,
        isRegistered: true,
      },
    ]);
    setUserResults([]);
    setUserSearch("");
  };

  const removePlayer = (idx: number) =>
    setPlayers((prev) => prev.filter((_, i) => i !== idx));

  const activePlayers = players.filter(
    (p) => mode === "casual" || p.selected !== false
  );

  const canGoToStep3 = activePlayers.length >= 1;
  const canCreate = gameName.trim().length >= 1 && activePlayers.length >= 1;

  const handleCreate = async () => {
    if (!canCreate) return;

    if (isGuest) {
      // Local guest session
      guestStore.createSession(
        gameName.trim(),
        activePlayers.map((p) => p.display_name)
      );
      router.push("/dashboard/sessions/local");
      return;
    }

    if (!user) return;
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
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  const modeInfo = {
    closed_group: {
      label: t.sessions.mode_closed,
      desc: t.sessions.mode_closed_desc,
      Icon: Users,
      color: "blue",
    },
    hybrid: {
      label: t.sessions.mode_hybrid,
      desc: t.sessions.mode_hybrid_desc,
      Icon: Shuffle,
      color: "purple",
    },
    casual: {
      label: t.sessions.mode_casual,
      desc: t.sessions.mode_casual_desc,
      Icon: UserPlus,
      color: "brand",
    },
  } as const;

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Title */}
      <h1 className="text-2xl font-display font-bold text-white">
        {t.sessions.setupTitle}
      </h1>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {([
          { n: 1 as const, label: t.sessions.step_mode },
          { n: 2 as const, label: t.sessions.step_players },
          { n: 3 as const, label: t.sessions.step_game },
        ]).map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${
                  step === n
                    ? "bg-brand-500 border-brand-500 text-white"
                    : step > n
                    ? "bg-brand-500/20 border-brand-500/30 text-brand-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
              >
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${step >= n ? "text-white" : "text-slate-500"}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-px mx-2 ${step > n ? "bg-brand-500/30" : "bg-slate-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Mode ── */}
      {step === 1 && (
        <>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{t.sessions.chooseModeTitle}</h2>
            <p className="text-slate-400 text-sm mt-1">{t.sessions.chooseModeDesc}</p>
          </div>
          <div className="flex flex-col gap-3">
            {availableModes.map((key) => {
              const info = modeInfo[key];
              const Icon = info.Icon;
              const isSelected = mode === key;
              const colorBorder: Record<string, string> = {
                blue: "border-blue-500/40 bg-blue-500/5",
                purple: "border-purple-500/40 bg-purple-500/5",
                brand: "border-brand-500/40 bg-brand-500/5",
              };
              const colorIcon: Record<string, string> = {
                blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                brand: "text-brand-400 bg-brand-500/10 border-brand-500/20",
              };
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`glass-card p-5 flex items-center gap-4 text-left transition-all cursor-pointer border ${
                    isSelected ? colorBorder[info.color] : "border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className={`p-3 rounded-xl border ${isSelected ? colorIcon[info.color] : "text-slate-500 bg-slate-900 border-slate-800"}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className={`font-bold font-display text-base ${isSelected ? "text-white" : "text-slate-300"}`}>{info.label}</span>
                    <span className="text-xs text-slate-400 leading-relaxed">{info.desc}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-brand-500 bg-brand-500" : "border-slate-700"}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-semibold py-3.5 px-6 rounded-xl border border-brand-600/30 transition-all flex items-center justify-center gap-2"
          >
            {t.sessions.nextPlayers} <ArrowRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── STEP 2: Players ── */}
      {step === 2 && (
        <>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{t.sessions.setupPlayers}</h2>
          </div>

          {/* Group selector */}
          {(mode === "closed_group" || mode === "hybrid") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.sessions.selectCircle}</label>
              {groupsLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-slate-400">{t.sessions.noCirclesForMode}{" "}<Link href="/dashboard/groups" className="text-brand-400 underline">Create one.</Link></p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer text-sm"
                  >
                    <option value="">-- {t.sessions.selectCircle} --</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.member_count})</option>)}
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
                {t.sessions.step_players} ({activePlayers.length})
              </label>
              {players.map((p, idx) => {
                const isActive = mode === "casual" || p.selected !== false;
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? "bg-slate-900/40 border-slate-800" : "bg-slate-950/30 border-slate-900/60 opacity-50"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${p.isRegistered ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white border-blue-500/20" : "bg-slate-800 text-slate-300 border-slate-700"}`}>
                      {p.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-white">
                      {p.display_name}
                      {p.isRegistered && <span className="ml-2 text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider">{p.isFromGroup ? "Circle" : "User"}</span>}
                    </span>
                    {mode === "hybrid" && p.isFromGroup && (
                      <button onClick={() => togglePlayer(idx)} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${p.selected ? "bg-brand-500/20 border-brand-500/30 text-brand-400" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                        {p.selected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    )}
                    {!p.isFromGroup && (
                      <button onClick={() => removePlayer(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-900/30 hover:bg-red-950/20 transition-all cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add anonymous player */}
          {(mode === "casual" || mode === "hybrid") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.sessions.addGuest}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.sessions.playerNamePlaceholder}
                  value={guestName}
                  onChange={(e) => { setGuestName(e.target.value); setAddPlayerError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && addGuestPlayer()}
                  maxLength={30}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
                />
                <button onClick={addGuestPlayer} disabled={!guestName.trim()} className="px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl border border-brand-600/30 transition-all cursor-pointer">
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
              {addPlayerError && <p className="text-xs text-red-400">{addPlayerError}</p>}
            </div>
          )}

          {/* Add registered user (only for logged-in users) */}
          {!isGuest && (mode === "casual" || mode === "hybrid") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.sessions.addRegistered}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.sessions.searchUsernamePlaceholder}
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserSearchError(null); setUserResults([]); }}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  maxLength={30}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <button onClick={searchUsers} disabled={!userSearch.trim() || userSearchLoading} className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-slate-900 disabled:text-slate-600 text-blue-400 rounded-xl border border-blue-600/20 transition-all cursor-pointer">
                  {userSearchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              {userSearchError && <p className="text-xs text-red-400">{userSearchError}</p>}
              {userResults.length > 0 && (
                <div className="flex flex-col gap-1">
                  {userResults.map((u) => (
                    <button key={u.id} onClick={() => addRegisteredPlayer(u)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-blue-500/10 hover:border-blue-500/30 text-left cursor-pointer transition-all group">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center font-bold text-xs text-white border border-blue-500/20">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white group-hover:text-blue-400 transition-colors">{u.username}</span>
                      <span className="ml-auto text-[9px] text-blue-400 uppercase tracking-wider">+ Add</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm">{t.common.back}</button>
            <button onClick={() => setStep(3)} disabled={!canGoToStep3} className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-white font-semibold py-3 px-4 rounded-xl border border-brand-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm">
              {t.sessions.nextGame} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* ── STEP 3: Game ── */}
      {step === 3 && (
        <>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{t.sessions.chooseGameTitle}</h2>
          </div>

          {/* Summary */}
          <div className="glass-card p-4 border-slate-900 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.sessions.summaryTitle}</p>
            <div className="flex flex-wrap gap-2">
              {activePlayers.map((p, i) => (
                <span key={i} className="text-xs bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-slate-300 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.isRegistered ? "bg-blue-400" : "bg-brand-500/60"}`} />
                  {p.display_name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.sessions.chooseGameTitle}</label>
            <input
              type="text"
              placeholder={t.sessions.gameNamePlaceholder}
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              maxLength={80}
              autoFocus
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 px-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/10 transition-all"
            />
          </div>

          {createError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium">{createError}</div>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm">{t.common.back}</button>
            <button onClick={handleCreate} disabled={!canCreate || creating} className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-white font-semibold py-3 px-4 rounded-xl border border-brand-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm">
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.sessions.starting}</> : t.sessions.startSession}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Group, GroupRepository } from "@/repositories/GroupRepository";
import { 
  Users, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  X
} from "lucide-react";

export default function GroupsPage() {
  const router = useRouter();
  const { user, isGuest, isLoading: isAuthLoading } = useRequireAuth(true);
  const { language, t } = useLanguageStore();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuestWarningOpen, setIsGuestWarningOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateClick = () => {
    if (isGuest) {
      setIsGuestWarningOpen(true);
    } else {
      setNewGroupName("");
      setNewGroupDesc("");
      setCreateError(null);
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (user) {
      fetchGroups();
    } else if (isGuest) {
      setLoading(false);
    }
  }, [user, isGuest, isAuthLoading]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await GroupRepository.getGroups();
      setGroups(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not fetch your gaming circles.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newGroupName.trim()) {
      setCreateError("Group name is required.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      const newGroup = await GroupRepository.createGroup(
        newGroupName,
        newGroupDesc,
        user.id
      );

      // Auto redirect to new group details page
      router.push(`/dashboard/groups/${newGroup.id}`);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create group.");
    } finally {
      setCreateLoading(false);
    }
  };

  // 1. Loading Session state
  if (isAuthLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  // Guest block removed (guest browsing is now permitted, actions are restricted instead)

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-6 text-white animate-fade-in">
      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 flex items-center justify-between gap-3 shadow-md">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              <strong>{language === "es" ? "Modo Invitado" : "Guest Mode"}:</strong> {t.groups.guestBlocked}
            </span>
          </span>
          <Link href="/auth/register" className="font-bold underline hover:text-blue-300 transition-colors shrink-0">
            {t.groups.registerNow}
          </Link>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            {t.groups.title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Organize match sessions, compare stats, and invite playing partners.</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="ml-auto bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-lg shadow-brand-950/20 transition-all flex items-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          {t.groups.create}
        </button>
      </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-slate-500 text-sm mt-3">Fetching groups...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <p className="font-semibold text-sm">{errorMsg}</p>
            <button 
              onClick={fetchGroups}
              className="mt-2 text-xs font-bold text-white bg-red-950/30 hover:bg-red-950/50 border border-red-800/30 rounded-lg px-3 py-1.5 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center gap-4 border-slate-900 mt-4">
            <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800 text-slate-500">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              {isGuest ? t.groups.title : "No Circles Yet"}
            </h3>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              {isGuest 
                ? t.groups.guestBlocked
                : "You aren't a member of any circles. Create your first group to start inviting friends and competing!"
              }
            </p>
            {isGuest ? (
              <Link
                href="/auth/register"
                className="mt-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium py-2.5 px-5 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all cursor-pointer text-sm flex items-center gap-2"
              >
                {t.groups.registerNow} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={handleCreateClick}
                className="mt-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium py-2.5 px-5 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all cursor-pointer text-sm"
              >
                Create a Circle Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {groups.map((group) => (
              <Link 
                key={group.id}
                href={`/dashboard/groups/${group.id}`}
                className="glass-card p-5 border border-slate-850 hover:border-blue-500/20 transition-all flex flex-col gap-3 group text-left cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                    {group.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-900 border border-slate-850 text-slate-400 rounded-full">
                    {group.member_count} {group.member_count === 1 ? "Member" : "Members"}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm line-clamp-2 min-h-[40px] leading-relaxed">
                  {group.description || "No description provided."}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-900/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                  {user && group.created_by === user.id && (
                    <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10 text-[9px] uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

      {/* CREATE CIRCLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md border-slate-800 p-6 flex flex-col gap-4 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-display font-bold text-xl text-white">Create Gaming Circle</h3>
              <p className="text-xs text-slate-400 mt-1">
                Establish a new play group and invite your friends.
              </p>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Circle Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friday Night Dice"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  disabled={createLoading}
                  maxLength={50}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  placeholder="Describe your gaming circle..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  disabled={createLoading}
                  rows={3}
                  maxLength={150}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all resize-none"
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-medium">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-850 text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUEST WARNING MODAL */}
      {isGuestWarningOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-sm border-slate-800 p-6 flex flex-col gap-4 relative text-center items-center">
            <button 
              onClick={() => setIsGuestWarningOpen(false)}
              className="absolute right-4 top-4 p-1.5 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-850 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
              <Lock className="w-10 h-10 animate-bounce" style={{ animationDuration: "1s" }} />
            </div>

            <div>
              <h3 className="font-display font-bold text-xl text-white">
                {t.groups.title}
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {t.groups.guestBlocked}
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2 w-full">
              <Link 
                href="/auth/register" 
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium rounded-xl border border-brand-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {t.groups.registerNow} <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsGuestWarningOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-medium rounded-xl transition-all flex items-center justify-center text-sm cursor-pointer"
              >
                {t.common.cancel || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

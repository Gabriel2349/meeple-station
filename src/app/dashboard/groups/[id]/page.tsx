"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { GroupDetails, GroupRepository } from "@/repositories/GroupRepository";
import { 
  Users, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  LogOut, 
  Crown, 
  Calendar, 
  UserPlus, 
  User,
  CheckCircle,
  X
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = resolvedParams.id;

  const { user, isGuest, isLoading: isAuthLoading } = useRequireAuth(false); // groups require real account
  
  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Administrative/Member Actions
  const [addUsername, setAddUsername] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds member_id being removed or 'delete'/'leave'

  useEffect(() => {
    if (user && groupId) {
      fetchGroupDetails();
    }
  }, [user, groupId, isAuthLoading]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await GroupRepository.getGroupDetails(groupId);
      setDetails(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch group details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim() || !details) return;

    try {
      setAddLoading(true);
      setAddError(null);
      setAddSuccess(false);

      await GroupRepository.addMemberByUsername(details.id, addUsername);
      
      setAddSuccess(true);
      setAddUsername("");
      
      // Refresh details to show new member
      await fetchGroupDetails();

      // Clear success alert after 3 seconds
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err: any) {
      setAddError(err.message || "Could not add user.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!details) return;
    const confirmRemove = confirm(`Are you sure you want to remove ${username} from the group?`);
    if (!confirmRemove) return;

    try {
      setActionLoading(memberId);
      await GroupRepository.removeMember(details.id, memberId);
      await fetchGroupDetails();
    } catch (err: any) {
      alert(err.message || "Could not remove member.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!details || !user) return;
    const confirmLeave = confirm("Are you sure you want to leave this gaming group?");
    if (!confirmLeave) return;

    try {
      setActionLoading("leave");
      await GroupRepository.removeMember(details.id, user.id);
      router.push("/dashboard/groups");
    } catch (err: any) {
      alert(err.message || "Could not leave group.");
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!details) return;
    const confirmDelete = confirm("CRITICAL WARNING: Are you sure you want to delete this group? This will remove all history and members. This action is irreversible!");
    if (!confirmDelete) return;

    try {
      setActionLoading("delete");
      await GroupRepository.deleteGroup(details.id);
      router.push("/dashboard/groups");
    } catch (err: any) {
      alert(err.message || "Could not delete group.");
      setActionLoading(null);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (errorMsg || !details) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-white min-h-screen text-center">
        <div className="glass-card p-8 max-w-md w-full flex flex-col items-center gap-4 border-slate-800">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold font-display">Access Failed</h2>
          <p className="text-slate-400 text-sm">{errorMsg || "This group does not exist or you do not have permission to view it."}</p>
          <Link 
            href="/dashboard/groups"
            className="mt-2 w-full py-2.5 px-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user && details.created_by === user.id;
  const adminMember = details.members.find(m => m.profile.id === details.created_by);
  const adminName = adminMember ? adminMember.profile.username : "Unknown Admin";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="w-full border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center sticky top-0 z-50">
        <Link 
          href="/dashboard/groups"
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all mr-4 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl tracking-tight text-white">
              {details.name}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-850 text-slate-400 rounded-md">
              {details.members.length} {details.members.length === 1 ? "Member" : "Members"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wider flex items-center gap-1 mt-0.5">
            <Crown className="w-3 h-3 text-amber-500" /> Admin: {adminName}
          </p>
        </div>

        {/* Delete Group / Leave Group Buttons in Navbar for desktop */}
        <div className="ml-auto hidden sm:block">
          {isAdmin ? (
            <button
              onClick={handleDeleteGroup}
              disabled={actionLoading !== null}
              className="bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-medium py-2 px-4 rounded-xl border border-red-950/30 hover:border-red-900/50 transition-all flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50"
            >
              {actionLoading === "delete" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Group
            </button>
          ) : (
            <button
              onClick={handleLeaveGroup}
              disabled={actionLoading !== null}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium py-2 px-4 rounded-xl border border-slate-850 hover:border-slate-750 transition-all flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50"
            >
              {actionLoading === "leave" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Leave Group
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Details & Invite */}
        <section className="flex-1 flex flex-col gap-6 md:max-w-sm">
          {/* Info Card */}
          <div className="glass-card p-6 flex flex-col gap-4 border-slate-900">
            <h2 className="font-display font-bold text-lg text-white border-b border-slate-900 pb-2">
              Group Info
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Description</span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  {details.description || "No description provided."}
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-400 mt-2 text-xs">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Established {new Date(details.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Admin Tools: Invite Member */}
          {isAdmin && (
            <div className="glass-card p-6 flex flex-col gap-4 border-slate-900">
              <h2 className="font-display font-bold text-lg text-white border-b border-slate-900 pb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Add Member
              </h2>
              <p className="text-xs text-slate-400">
                Invite a registered user to join this group by entering their exact username.
              </p>

              <form onSubmit={handleAddMember} className="flex flex-col gap-3 mt-1 text-left">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Search by username"
                    value={addUsername}
                    onChange={(e) => {
                      setAddUsername(e.target.value);
                      if (addError) setAddError(null);
                    }}
                    disabled={addLoading}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>

                {addError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                    {addError}
                  </div>
                )}

                {addSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>User added successfully!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-850 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-xl border border-brand-600/30 hover:border-brand-500/50 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {addLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Leave/Delete buttons for mobile layout */}
          <div className="block sm:hidden mt-2">
            {isAdmin ? (
              <button
                onClick={handleDeleteGroup}
                disabled={actionLoading !== null}
                className="w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 font-medium py-3 px-4 rounded-xl border border-red-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                disabled={actionLoading !== null}
                className="w-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-850 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <LogOut className="w-4 h-4" />
                Leave Group
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Member List */}
        <section className="flex-1">
          <div className="glass-card p-6 flex flex-col gap-4 border-slate-900 h-full">
            <h2 className="font-display font-bold text-lg text-white border-b border-slate-900 pb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Members List
            </h2>

            <div className="flex flex-col gap-3 mt-2">
              {details.members.map((member) => {
                const isMemberAdmin = member.profile.id === details.created_by;
                const isCurrentUser = user && member.profile.id === user.id;

                return (
                  <div 
                    key={member.profile.id}
                    className="flex items-center justify-between p-3.5 bg-slate-900/30 border border-slate-900/60 rounded-xl hover:border-slate-800/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border ${
                        isMemberAdmin 
                          ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white border-brand-500/20 shadow-sm shadow-brand-950/10" 
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}>
                        {member.profile.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                          {member.profile.username}
                          {isCurrentUser && (
                            <span className="text-[9px] text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded font-normal">
                              You
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions and Badges */}
                    <div className="flex items-center gap-3">
                      {isMemberAdmin ? (
                        <span className="flex items-center gap-1.5 text-[9px] font-bold text-brand-400 bg-brand-500/10 px-2 py-1 rounded-md border border-brand-500/20 uppercase tracking-wider">
                          <Crown className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        isAdmin && (
                          <button
                            onClick={() => handleRemoveMember(member.profile.id, member.profile.username)}
                            disabled={actionLoading === member.profile.id}
                            title="Remove from group"
                            className="p-2 bg-slate-900/50 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-950/20 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === member.profile.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

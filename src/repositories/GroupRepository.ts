import { supabase } from "@/utils/supabaseClient";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMemberProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface GroupMember {
  joined_at: string;
  profile: GroupMemberProfile;
}

export interface GroupDetails extends Group {
  members: GroupMember[];
}

export const GroupRepository = {
  /**
   * Creates a new game circle (group)
   */
  async createGroup(name: string, description: string, creatorId: string): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        created_by: creatorId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Retrieves all groups the user belongs to or created.
   * Relying on Supabase RLS policies to perform the security filtering automatically.
   */
  async getGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        group_members(profile_id)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Map to include member_count
    return (data || []).map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      created_by: group.created_by,
      created_at: group.created_at,
      member_count: group.group_members ? group.group_members.length : 0,
    }));
  },

  /**
   * Fetches full group details, including all members and their profiles.
   */
  async getGroupDetails(groupId: string): Promise<GroupDetails> {
    const { data, error } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        description,
        created_by,
        created_at,
        group_members (
          joined_at,
          profiles (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq("id", groupId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Cast the response to match the interface structure
    const rawMembers = data.group_members || [];
    const members: GroupMember[] = rawMembers
      .filter((m: any) => m.profiles !== null)
      .map((m: any) => ({
        joined_at: m.joined_at,
        profile: {
          id: m.profiles.id,
          username: m.profiles.username,
          avatar_url: m.profiles.avatar_url,
        },
      }));

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      created_by: data.created_by,
      created_at: data.created_at,
      members,
    };
  },

  /**
   * Adds a member to a group searching by their exact public username.
   */
  async addMemberByUsername(groupId: string, username: string): Promise<void> {
    const cleanUsername = username.trim();
    
    // 1. Resolve username to profile ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (!profile) {
      throw new Error(`User with username "${cleanUsername}" not found.`);
    }

    // 2. Insert member row
    const { error: insertError } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        profile_id: profile.id,
      });

    if (insertError) {
      if (insertError.code === "23505") { // Unique violation / primary key error
        throw new Error("This user is already a member of this group.");
      }
      throw new Error(insertError.message);
    }
  },

  /**
   * Removes a member from a group (can be done by group admin, or user leaving).
   */
  async removeMember(groupId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("profile_id", profileId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Deletes a group (only allowed for group admin/creator).
   */
  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      throw new Error(error.message);
    }
  }
};

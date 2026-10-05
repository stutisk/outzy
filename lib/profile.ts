import { supabase } from "@/lib/supabase";

export type UserProfileRow = {
  id: string;
  username: string;
  bio?: string | null;
  city?: string | null;
  interests?: string[] | null;
  avatar_url?: string | null;
};

/** Load public.users row; distinguishes DB errors from “no profile yet”. */
export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, bio, city, interests, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { profile: null as UserProfileRow | null, error };
  }

  return { profile: data as UserProfileRow | null, error: null };
}

export function isProfileComplete(
  profile: UserProfileRow | null | undefined
): boolean {
  return Boolean(profile?.username?.trim());
}

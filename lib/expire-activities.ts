import { supabase } from "@/lib/supabase";

/** Lazy expiry sweep (pending → cancelled for ended plans). Safe to call often. */
export async function runExpirePastActivities(): Promise<void> {
  const { error } = await supabase.rpc("expire_past_activities");
  if (error) {
    console.error("expire_past_activities:", error.message);
  }
}

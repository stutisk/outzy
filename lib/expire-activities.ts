import { supabase } from "@/lib/supabase";

/** Lazy expiry sweep (pending → cancelled for ended plans). Safe to call often. */
export async function runExpirePastActivities(): Promise<void> {
  await supabase.rpc("expire_past_activities");
}

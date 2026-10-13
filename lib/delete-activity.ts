import { supabase } from "@/lib/supabase";

/** Hard-delete a plan and related rows (host only). Returns false if nothing was removed. */
export async function deleteHostActivity(activityId: string): Promise<{
  ok: boolean;
  errorMessage: string | null;
}> {
  const { data: rpcOk, error: rpcError } = await supabase.rpc(
    "delete_host_activity",
    { p_activity_id: activityId },
  );

  if (!rpcError && rpcOk === true) {
    return { ok: true, errorMessage: null };
  }

  const { data: rows, error: deleteError } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .select("id");

  if (!deleteError && rows && rows.length > 0) {
    return { ok: true, errorMessage: null };
  }

  const hint =
    rpcError?.message?.includes("delete_host_activity") ||
    deleteError?.message?.includes("policy")
      ? "Apply supabase/migrations/20260328250000_activity_host_delete_cascade.sql in Supabase SQL Editor."
      : null;

  return {
    ok: false,
    errorMessage:
      hint ??
      rpcError?.message ??
      deleteError?.message ??
      "Delete did not remove the plan (check you are the host).",
  };
}

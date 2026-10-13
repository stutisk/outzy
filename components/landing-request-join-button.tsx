"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogleNext } from "@/lib/auth-nav";
import type { LandingJoinState, LandingPlan } from "@/lib/landing-plan-types";
import { supabase } from "@/lib/supabase";

const DEFAULT_MESSAGE = "Hi! I'd love to join — found this on Outzy.";

function buttonLabel(state: LandingJoinState): string {
  switch (state) {
    case "host":
      return "Your plan";
    case "pending":
      return "Request sent";
    case "accepted":
      return "You're in";
    case "rejected":
      return "Request declined";
    case "full":
      return "Plan is full";
    case "sample":
      return "Browse plans";
    default:
      return "Request to join";
  }
}

function isDisabled(state: LandingJoinState): boolean {
  return state !== "none" && state !== "sample";
}

type LandingRequestJoinButtonProps = {
  plan: LandingPlan;
  userId: string | null;
  className?: string;
  onJoinStateChange?: (activityId: string, state: LandingJoinState) => void;
};

export function LandingRequestJoinButton({
  plan,
  userId,
  className = "",
  onJoinStateChange,
}: LandingRequestJoinButtonProps) {
  const router = useRouter();
  const [joinState, setJoinState] = useState<LandingJoinState>(plan.joinState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = buttonLabel(joinState);
  const disabled = isDisabled(joinState) || loading;

  const handleClick = async () => {
    setError(null);

    if (plan.isSample || joinState === "sample") {
      router.push("/feed");
      return;
    }

    if (!userId) {
      await signInWithGoogleNext("/");
      return;
    }

    if (joinState !== "none") return;

    setLoading(true);
    try {
      const { data: existingRequest } = await supabase
        .from("activity_requests")
        .select("id, status")
        .eq("activity_id", plan.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRequest) {
        const st = existingRequest.status as LandingJoinState;
        const next =
          st === "pending" || st === "accepted" || st === "rejected"
            ? st
            : "pending";
        setJoinState(next);
        onJoinStateChange?.(plan.id, next);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("activity_requests").insert({
        activity_id: plan.id,
        user_id: userId,
        message: DEFAULT_MESSAGE,
        status: "pending",
      });

      if (insertError) {
        console.error("Landing join request:", insertError);
        setError("Could not send request. Try again.");
        setLoading(false);
        return;
      }

      setJoinState("pending");
      onJoinStateChange?.(plan.id, "pending");
    } catch (e) {
      console.error(e);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
        className={`mt-4 w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {loading ? "Sending…" : label}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

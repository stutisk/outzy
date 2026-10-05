"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Spinner } from "@/components/spinner";

function ChatRedirect() {
  const params = useParams();
  const router = useRouter();
  const conversationId =
    typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (conversationId) {
      router.replace(`/messages?open=${conversationId}`);
    } else {
      router.replace("/messages");
    }
  }, [conversationId, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
      <Spinner label="Opening chat…" />
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
          <Spinner />
        </main>
      }
    >
      <ChatRedirect />
    </Suspense>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PageLoadingScreen } from "@/components/ui/page-state";

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

  return <PageLoadingScreen label="Opening chat…" />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoadingScreen label="Opening chat…" />}>
      <ChatRedirect />
    </Suspense>
  );
}

"use client";

import { useAvatarSession } from "@runwayml/avatars-react";
import { useEffect } from "react";

export function RpcBridge() {
  const session = useAvatarSession();

  useEffect(() => {
    if (session.state !== "active") return;

    const controller = new AbortController();
    void fetch("/api/avatar/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Server tools could not connect.");
        await response.text();
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error(error);
      });

    return () => controller.abort();
  }, [session.sessionId, session.state]);

  return null;
}

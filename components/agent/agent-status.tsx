"use client";

import { useAvatarStatus, useLocalMedia, useTranscript } from "@runwayml/avatars-react";

export function AgentStatus() {
  const avatar = useAvatarStatus();
  const { isMicEnabled, micError, retryMic } = useLocalMedia();
  const transcript = useTranscript({ interim: true, bufferSize: 6 });
  const latest = transcript.at(-1)?.text;

  return (
    <div className="absolute inset-x-3 top-3 z-10 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-xs backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${
              isMicEnabled ? "live-dot bg-[var(--accent)]" : "bg-red-300"
            }`}
          />
          {avatar.status === "ready"
            ? isMicEnabled
              ? "Listening"
              : "Microphone off"
            : "Connecting"}
        </span>
        {micError ? (
          <button
            className="font-semibold text-[var(--accent)]"
            onClick={() => void retryMic()}
          >
            Retry mic
          </button>
        ) : null}
      </div>
      {latest ? (
        <p className="mt-1 truncate text-white/55" aria-live="polite">
          Heard: {latest}
        </p>
      ) : null}
    </div>
  );
}

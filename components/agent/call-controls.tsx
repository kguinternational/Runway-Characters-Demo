"use client";

import { ControlBar, useLocalMedia } from "@runwayml/avatars-react";

export function CallControls() {
  const { micError, retryMic } = useLocalMedia();

  return (
    <>
      <ControlBar showCamera={false} showScreenShare />
      {micError ? (
        <div
          role="alert"
          className="absolute inset-x-3 bottom-14 z-20 flex items-center justify-between gap-3 rounded-xl bg-[#351d1a] px-3 py-2 text-xs text-[#ffd4ce]"
        >
          <span>Microphone access failed.</span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={retryMic}
          >
            Retry
          </button>
        </div>
      ) : null}
    </>
  );
}

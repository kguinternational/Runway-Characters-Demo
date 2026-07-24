"use client";

import {
  AvatarCall,
  AvatarVideo,
  ControlBar,
  ScreenShareVideo,
} from "@runwayml/avatars-react";
import { Headphones, MonitorUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { createAvatarSession } from "@/actions/avatar";
import { ClientToolHandlers } from "@/components/agent/client-tool-handlers";
import { Button } from "@/components/ui/button";
import { NOVA_AVATAR_ID, NOVA_IMAGE } from "@/lib/avatar";

export function AgentCard() {
  const [started, setStarted] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  async function startWithScreenShare() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    setScreenStream(stream);
    setStarted(true);
  }

  function endCall() {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setStarted(false);
  }

  return (
    <aside
      id="nova-agent"
      data-avatar-target="nova-agent"
      className="fixed inset-x-3 bottom-3 z-50 ml-auto overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#101514] text-white shadow-[0_28px_100px_rgba(4,8,7,0.36)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[350px] lg:bottom-7 lg:right-7"
      aria-label="Nova customer support agent"
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-white/10 px-4">
        <span className="size-2 rounded-full bg-[var(--accent)]" />
        <span className="text-sm font-semibold">Nova</span>
        <span className="font-mono text-[0.61rem] uppercase tracking-[0.15em] text-white/45">
          Customer support
        </span>
      </div>

      {started ? (
        <AvatarCall
          avatarId={NOVA_AVATAR_ID}
          connect={createAvatarSession}
          initialScreenStream={screenStream ?? undefined}
          video={false}
          className="h-[405px] rounded-none"
          onEnd={endCall}
          onError={console.error}
        >
          <AvatarVideo />
          <ScreenShareVideo />
          <ClientToolHandlers />
          <ControlBar showCamera={false} showScreenShare />
        </AvatarCall>
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-4">
            <Image
              src={NOVA_IMAGE}
              alt="Nova, Northstar customer support"
              width={72}
              height={72}
              className="size-[72px] rounded-2xl object-cover object-top"
              preload
            />
            <div>
              <p className="font-mono text-[0.61rem] uppercase tracking-[0.16em] text-white/42">
                Runway Character
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                How can I help?
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <Button
              variant="accent"
              className="w-full"
              onClick={startWithScreenShare}
            >
              <MonitorUp className="size-4" />
              Share screen & call
            </Button>
            <Button
              variant="ghost"
              className="w-full border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
              onClick={() => setStarted(true)}
            >
              <Headphones className="size-4" />
              Voice only
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

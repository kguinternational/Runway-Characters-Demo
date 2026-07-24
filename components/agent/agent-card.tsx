"use client";

import {
  AvatarCall,
  AvatarVideo,
  ControlBar,
  ScreenShareVideo,
} from "@runwayml/avatars-react";
import { Headphones, LoaderCircle, MonitorUp, Sparkles } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { createAvatarSession } from "@/app/avatar-actions";
import { AgentStatus } from "@/components/agent/agent-status";
import { ClientToolHandlers } from "@/components/agent/client-tool-handlers";
import { RpcBridge } from "@/components/agent/rpc-bridge";
import { Button } from "@/components/ui/button";
import { NOVA_AVATAR_ID, NOVA_IMAGE } from "@/lib/avatar";

export function AgentCard() {
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endCall = useCallback(() => {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setStarted(false);
    setStarting(false);
  }, [screenStream]);

  useEffect(() => endCall, [endCall]);

  async function startCall(shareScreen: boolean) {
    setError(null);
    setStarting(true);

    try {
      const stream = shareScreen
        ? await navigator.mediaDevices.getDisplayMedia({ video: true })
        : null;
      setScreenStream(stream);
      setStarted(true);
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Could not start the call.",
      );
    } finally {
      setStarting(false);
    }
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
        <div className="relative h-[405px]">
          <AvatarCall
            avatarId={NOVA_AVATAR_ID}
            connect={createAvatarSession}
            avatarImageUrl={NOVA_IMAGE}
            initialScreenStream={screenStream ?? undefined}
            audio
            video={false}
            className="nova-call"
            onEnd={endCall}
            onError={(callError) => setError(callError.message)}
          >
            <AvatarVideo />
            <ScreenShareVideo />
            <AgentStatus />
            <ClientToolHandlers />
            <RpcBridge />
            <ControlBar showCamera={false} showScreenShare />
          </AvatarCall>
        </div>
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
          <p className="mt-4 text-sm leading-6 text-white/58">
            Start a call, then ask Nova to navigate, inspect revenue, or create a ticket.
          </p>
          {error ? (
            <p className="mt-3 rounded-xl bg-red-400/10 px-3 py-2 text-xs leading-5 text-red-200">
              {error}
            </p>
          ) : null}
          <div className="mt-5 grid gap-2">
            <Button
              variant="accent"
              className="w-full"
              disabled={starting}
              onClick={() => void startCall(true)}
            >
              {starting ? <LoaderCircle className="size-4 animate-spin" /> : <MonitorUp className="size-4" />}
              Share screen & call
            </Button>
            <Button
              variant="ghost"
              className="w-full border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
              disabled={starting}
              onClick={() => void startCall(false)}
            >
              {starting ? <LoaderCircle className="size-4 animate-spin" /> : <Headphones className="size-4" />}
              Voice only
            </Button>
          </div>
        </div>
      )}

      <div className="flex h-10 items-center gap-2 border-t border-white/10 px-4 font-mono text-[0.62rem] text-white/48">
        <Sparkles className="size-3.5 text-[var(--accent)]" />
        Short greeting · live microphone status
      </div>
    </aside>
  );
}

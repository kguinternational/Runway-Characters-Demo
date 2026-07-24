"use client";

import {
  AvatarCall,
  AvatarVideo,
  ScreenShareVideo,
  type SessionCredentials,
} from "@runwayml/avatars-react";
import { Headphones, MonitorUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { createAvatarSession } from "@/actions/avatar";
import { CallControls } from "@/components/agent/call-controls";
import { ClientToolHandlers } from "@/components/agent/client-tool-handlers";
import { Button } from "@/components/ui/button";
import { NOVA_AVATAR_ID, NOVA_IMAGE } from "@/lib/avatar";

export function AgentCard() {
  const [credentials, setCredentials] =
    useState<SessionCredentials | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function startCall(stream?: MediaStream) {
    setError(null);
    setStarting(true);
    try {
      const freshCredentials = await createAvatarSession();
      setScreenStream(stream ?? null);
      setCredentials(freshCredentials);
    } catch (callError) {
      console.error(callError);
      stream?.getTracks().forEach((track) => track.stop());
      setError(
        "The call could not start. Check the local Runway setup and try again.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function startWithScreenShare() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      await startCall(stream);
    } catch {
      setError(
        "Screen sharing was cancelled or blocked. Try again and choose this tab.",
      );
    }
  }

  function endCall() {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setCredentials(null);
  }

  function handleCallError(callError: Error) {
    console.error(callError);
    setError(
      "The call could not start. Check the local Runway setup and try again.",
    );
    endCall();
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

      {credentials ? (
        <AvatarCall
          avatarId={NOVA_AVATAR_ID}
          credentials={credentials}
          initialScreenStream={screenStream ?? undefined}
          video={false}
          className="h-[405px] rounded-none"
          onEnd={endCall}
          onError={handleCallError}
        >
          <AvatarVideo />
          <ScreenShareVideo />
          <ClientToolHandlers />
          <CallControls />
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
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/38">
              What Nova can do
            </p>
            <p className="mt-2 text-xs leading-5 text-white/62">
              Navigate, click, scroll, highlight, explain pages, change revenue
              ranges, read live revenue, open details, and create tickets.
            </p>
          </div>
          <div className="mt-5 grid gap-2">
            <Button
              id="start-screen-call"
              data-avatar-target="start-screen-call"
              variant="accent"
              className="w-full"
              disabled={starting}
              onClick={startWithScreenShare}
            >
              <MonitorUp className="size-4" />
              {starting ? "Starting call…" : "Share screen & call"}
            </Button>
            <Button
              id="start-voice-call"
              data-avatar-target="start-voice-call"
              variant="ghost"
              className="w-full border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
              disabled={starting}
              onClick={() => startCall()}
            >
              <Headphones className="size-4" />
              {starting ? "Starting call…" : "Voice only"}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-center text-xs text-[#ff9b90]">
              {error}
            </p>
          ) : null}
          <p className="mt-3 text-center font-mono text-[0.55rem] uppercase tracking-[0.11em] text-white/30">
            In call · mute · share or stop screen · end call
          </p>
        </div>
      )}
    </aside>
  );
}

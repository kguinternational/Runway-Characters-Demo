"use client";

import {
  AlertCircle,
  AudioLines,
  Check,
  LoaderCircle,
  Maximize2,
  MonitorUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AvatarCall,
  AvatarVideo,
  ControlBar,
  PageActions,
  ScreenShareVideo,
  useAvatarSession,
  useAvatarStatus,
  useClientEvent,
  useClientEvents,
  useLocalMedia,
  type SessionCredentials,
} from "@runwayml/avatars-react";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import {
  openPanelTool,
  setDateRangeTool,
} from "@/lib/tools";
import type {
  InfoPanelState,
  RevenueRange,
  RpcEvent,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const DEFAULT_AVATAR_ID = "music-superstar";
const AVATAR_ID =
  process.env.NEXT_PUBLIC_RUNWAY_AVATAR_ID ?? DEFAULT_AVATAR_ID;

type Phase = "idle" | "sharing" | "provisioning" | "connecting" | "active" | "error";
type NovaSession = SessionCredentials & { avatarId?: string };

export function NovaCard({
  onRangeChange,
  onPanelOpen,
}: {
  onRangeChange: (range: RevenueRange) => void;
  onPanelOpen: (panel: InfoPanelState) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<NovaSession | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(
    "Ready for a voice prompt",
  );
  const rpcAbortRef = useRef<AbortController | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingTicketIdRef = useRef<number | null>(null);

  const stopScreenStream = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
  }, []);

  const cancelRunwaySession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!sessionId) return;

    await fetch("/api/avatar/connect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => undefined);
  }, []);

  const resetSession = useCallback(() => {
    rpcAbortRef.current?.abort();
    rpcAbortRef.current = null;
    stopScreenStream();
    setSession(null);
    sessionIdRef.current = null;
    pendingTicketIdRef.current = null;
    setError(null);
    setPhase("idle");
    setLastActivity("Ready for a voice prompt");
  }, [stopScreenStream]);

  useEffect(() => resetSession, [resetSession]);

  const failSession = useCallback(
    (message: string) => {
      rpcAbortRef.current?.abort();
      rpcAbortRef.current = null;
      stopScreenStream();
      void cancelRunwaySession();
      setSession(null);
      setPhase("error");
      setError(message);
      setLastActivity(message);
    },
    [cancelRunwaySession, stopScreenStream],
  );

  const handleRpcEvent = useCallback((event: RpcEvent) => {
    if (event.type === "tool" && event.tool === "get_revenue") {
      const total = Number(event.result?.total ?? 0);
      setLastActivity(
        total ? `Revenue checked · ${formatCurrency(total)}` : "Revenue checked in Convex",
      );
    }
    if (event.type === "tool" && event.tool === "create_ticket") {
      const ticketId = Number(event.result?.ticketId ?? 0);
      pendingTicketIdRef.current = ticketId || null;
      setLastActivity(
        ticketId ? `Ticket #${ticketId} created` : "Ticket created in Convex",
      );
    }
    if (event.type === "error") {
      setLastActivity(event.message ?? "A server tool reported an error");
    }
  }, []);

  const openRpcStream = useCallback(
    async (sessionId: string) => {
      const controller = new AbortController();
      rpcAbortRef.current = controller;

      const response = await fetch("/api/avatar/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Nova's server tools could not connect.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let connected = false;
      let resolveConnected!: () => void;
      let rejectConnected!: (error: Error) => void;

      const connectedPromise = new Promise<void>((resolve, reject) => {
        resolveConnected = resolve;
        rejectConnected = reject;
      });

      void (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              const event = JSON.parse(line) as RpcEvent;
              if (event.type === "connected" && !connected) {
                connected = true;
                resolveConnected();
              }
              handleRpcEvent(event);
            }
          }

          if (!controller.signal.aborted) {
            const disconnectError = new Error(
              connected
                ? "Nova's server tools disconnected. Start a fresh call to continue."
                : "Nova's server tools disconnected early.",
            );
            if (connected) failSession(disconnectError.message);
            else rejectConnected(disconnectError);
          }
        } catch (streamError) {
          if (!controller.signal.aborted) {
            const normalized =
              streamError instanceof Error
                ? streamError
                : new Error("Nova's server tool stream failed.");
            if (connected) failSession(normalized.message);
            else rejectConnected(normalized);
          }
        }
      })();

      const timeout = window.setTimeout(() => {
        if (!connected) {
          rejectConnected(new Error("Nova's server tools took too long to connect."));
        }
      }, 12_000);

      try {
        await connectedPromise;
      } finally {
        window.clearTimeout(timeout);
      }
    },
    [failSession, handleRpcEvent],
  );

  const handleCallReady = useCallback(() => {
    const hasLiveScreen = screenStreamRef.current
      ?.getVideoTracks()
      .some((track) => track.readyState === "live");

    setError(null);
    setPhase("active");
    setLastActivity(
      hasLiveScreen
        ? "Live · Nova can see this tab"
        : "Live · voice connected, screen sharing is off",
    );
  }, []);

  const handlePanelOpen = useCallback(
    (panel: InfoPanelState) => {
      const ticketId = pendingTicketIdRef.current;
      pendingTicketIdRef.current = null;

      if (!ticketId) {
        onPanelOpen(panel);
        return;
      }

      const ticketLabel = `#${ticketId}`;
      onPanelOpen({
        title: panel.title.includes(String(ticketId))
          ? panel.title
          : `Ticket ${ticketLabel} opened`,
        body: panel.body.includes(String(ticketId))
          ? panel.body
          : `${panel.body} Ticket ${ticketLabel}.`,
      });
    },
    [onPanelOpen],
  );

  const startCall = useCallback(
    async (shareScreen: boolean) => {
      setError(null);
      setPhase(shareScreen ? "sharing" : "provisioning");

      let requestedStream: MediaStream | null = null;
      try {
        if (shareScreen) {
          if (!navigator.mediaDevices?.getDisplayMedia) {
            throw new Error("Screen sharing is not supported in this browser.");
          }
          requestedStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
          screenStreamRef.current = requestedStream;
          setScreenStream(requestedStream);
          requestedStream.getVideoTracks()[0]?.addEventListener(
            "ended",
            () => {
              if (screenStreamRef.current === requestedStream) {
                screenStreamRef.current = null;
                setScreenStream(null);
              }
              setLastActivity("Screen sharing stopped — voice remains live");
            },
            { once: true },
          );
        }

        setPhase("provisioning");
        setLastActivity("Provisioning a fresh 5-minute session…");
        const response = await fetch("/api/avatar/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarId: AVATAR_ID }),
        });
        const payload = (await response.json()) as NovaSession & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Runway could not create the session.");
        }
        sessionIdRef.current = payload.sessionId;

        setPhase("connecting");
        setLastActivity("Connecting the Convex server tools…");
        await openRpcStream(payload.sessionId);
        if (!rpcAbortRef.current || rpcAbortRef.current.signal.aborted) {
          throw new Error("Nova's server tools disconnected before the call started.");
        }
        setSession(payload);
        setLastActivity("Joining Nova and requesting microphone access…");
      } catch (startError) {
        rpcAbortRef.current?.abort();
        rpcAbortRef.current = null;
        await cancelRunwaySession();
        requestedStream?.getTracks().forEach((track) => track.stop());
        stopScreenStream();
        setSession(null);
        setPhase("error");
        const message =
          startError instanceof Error
            ? startError.message
            : "Nova could not start the call.";
        setError(message);
        setLastActivity(message);
      }
    },
    [cancelRunwaySession, openRpcStream, stopScreenStream],
  );

  const handleAvatarError = useCallback(
    (avatarError: Error) => {
      failSession(
        avatarError.message || "The realtime call ended unexpectedly.",
      );
    },
    [failSession],
  );

  const isStarting = ["sharing", "provisioning", "connecting"].includes(phase);

  return (
    <aside
      id="nova-agent"
      data-avatar-target="nova-agent"
      className="fixed inset-x-3 bottom-3 z-50 ml-auto overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#101514] text-white shadow-[0_28px_100px_rgba(4,8,7,0.36)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[350px] lg:bottom-7 lg:right-7"
      aria-label="Nova realtime support agent"
    >
      <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "size-2 rounded-full",
              phase === "active" ? "live-dot bg-[var(--accent)]" : "bg-white/25",
            )}
          />
          <span className="text-sm font-semibold tracking-[-0.01em]">Nova</span>
          <span className="font-mono text-[0.61rem] uppercase tracking-[0.15em] text-white/45">
            Revenue support
          </span>
        </div>
        <Maximize2 className="size-3.5 text-white/35" aria-hidden="true" />
      </div>

      {session ? (
        <div className="relative h-[430px] sm:h-[405px]">
          <AvatarCall
            avatarId={session.avatarId ?? AVATAR_ID}
            credentials={session}
            initialScreenStream={screenStream ?? undefined}
            audio
            video={false}
            className="nova-call"
            onEnd={resetSession}
            onError={handleAvatarError}
          >
            <AvatarVideo />
            <ScreenShareVideo />
            <ClientToolHandlers
              onRangeChange={onRangeChange}
              onPanelOpen={handlePanelOpen}
              onActivity={setLastActivity}
            />
            <CallReadiness
              onReady={handleCallReady}
              onActivity={setLastActivity}
            />
            <ControlBar showCamera={false} showScreenShare />
          </AvatarCall>
          <div className="pointer-events-none absolute left-3 top-3 z-[6]">
            <StatusPill className="border border-white/10 bg-black/45 text-white backdrop-blur-lg">
              <AudioLines className="size-3 text-[var(--accent)]" />
              {phase === "active" ? "Live session" : "Joining session"}
            </StatusPill>
          </div>
        </div>
      ) : (
        <div className="relative min-h-[330px] overflow-hidden px-5 pb-5 pt-6">
          <div className="dashboard-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative">
            <div className="mb-5 flex items-center gap-4">
              <div className="relative size-[74px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {/* Official original Runway preset character artwork. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://runway-static-assets.s3.us-east-1.amazonaws.com/calliope-demo/presets-3-3/InApp_Avatar_2.png"
                  alt="Nova, the Runway preset character"
                  className="h-full w-full object-cover object-top"
                />
                <span className="absolute bottom-1.5 right-1.5 size-2.5 rounded-full border-2 border-[#101514] bg-[var(--accent)]" />
              </div>
              <div>
                <p className="font-mono text-[0.63rem] uppercase tracking-[0.16em] text-white/42">
                  Runway Character
                </p>
                <h2 className="mt-1 text-[1.8rem] font-semibold leading-none tracking-[-0.055em]">
                  Talk to your data.
                </h2>
              </div>
            </div>

            <p className="text-sm leading-6 text-white/62">
              Nova can see the dashboard, operate it, query live Convex data, and file a real ticket.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-[0.58rem] uppercase tracking-[0.1em] text-white/45">
              {[
                ["01", "See"],
                ["02", "Act"],
                ["03", "Query"],
              ].map(([number, label]) => (
                <div key={number} className="rounded-xl border border-white/10 bg-white/[0.035] px-2 py-2.5">
                  <span className="block text-[var(--accent)]">{number}</span>
                  <span className="mt-1 block">{label}</span>
                </div>
              ))}
            </div>

            {error ? (
              <div className="mt-4 flex gap-2.5 rounded-xl border border-[#ff8275]/20 bg-[#ff8275]/10 px-3 py-2.5 text-xs leading-5 text-[#ffc5bf]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="mt-5 space-y-2.5">
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isStarting}
                onClick={() => void startCall(true)}
              >
                {isStarting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <MonitorUp className="size-4" />
                )}
                {phase === "sharing"
                  ? "Choose this browser tab"
                  : phase === "provisioning"
                    ? "Creating fresh session"
                    : phase === "connecting"
                      ? "Connecting live tools"
                      : phase === "error"
                        ? "Retry with screen share"
                        : "Share screen & call Nova"}
              </Button>
              <Button
                variant="ghost"
                className="w-full border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
                disabled={isStarting}
                onClick={() => void startCall(false)}
              >
                {phase === "error" ? <RotateCcw className="size-4" /> : <Sparkles className="size-4" />}
                Start voice only
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-10 items-center gap-2 border-t border-white/10 px-4 font-mono text-[0.62rem] text-white/48">
        {phase === "active" ? (
          <Check className="size-3.5 text-[var(--accent)]" />
        ) : (
          <span className="size-1.5 rounded-full bg-white/25" />
        )}
        <span className="truncate">{lastActivity}</span>
      </div>
    </aside>
  );
}

function CallReadiness({
  onReady,
  onActivity,
}: {
  onReady: () => void;
  onActivity: (message: string) => void;
}) {
  const session = useAvatarSession();
  const avatar = useAvatarStatus();
  const { hasMic, micError, retryMic } = useLocalMedia();

  useEffect(() => {
    if (micError) {
      onActivity("Microphone permission is required to talk to Nova");
      return;
    }

    if (
      session.state === "active" &&
      avatar.status === "ready" &&
      hasMic
    ) {
      onReady();
    }
  }, [avatar.status, hasMic, micError, onActivity, onReady, session.state]);

  if (!micError) return null;

  return (
    <div className="absolute inset-x-3 bottom-16 z-10 rounded-xl border border-[#ff8275]/25 bg-[#2a1716]/95 p-3 text-xs text-[#ffd2cd] shadow-xl backdrop-blur">
      <p>Allow microphone access so Nova can hear you.</p>
      <button
        className="mt-2 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]"
        onClick={() => void retryMic()}
      >
        Retry microphone
      </button>
    </div>
  );
}

function ClientToolHandlers({
  onRangeChange,
  onPanelOpen,
  onActivity,
}: {
  onRangeChange: (range: RevenueRange) => void;
  onPanelOpen: (panel: InfoPanelState) => void;
  onActivity: (message: string) => void;
}) {
  useClientEvent(setDateRangeTool, ({ range }) => {
    onRangeChange(range);
    onActivity(`Client tool · showing ${range}`);
  });

  useClientEvent(openPanelTool, ({ title, body }) => {
    onPanelOpen({ title, body });
    onActivity("Client tool · confirmation panel opened");
  });

  useClientEvents((event) => {
    if (event.tool === "scroll_to") onActivity("Page action · scrolled to chart");
    if (event.tool === "highlight") onActivity("Page action · highlighted chart");
    if (event.tool === "click") onActivity("Page action · clicked dashboard control");
  });

  return <PageActions highlightDuration={2_800} scrollBlock="center" />;
}

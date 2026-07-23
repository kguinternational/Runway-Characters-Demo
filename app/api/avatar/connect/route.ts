import type { SessionCredentials } from "@runwayml/avatars-react";
import { consumeSession } from "@runwayml/avatars-react/api";
import Runway from "@runwayml/sdk";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { z } from "zod";

import {
  NOVA_PERSONALITY,
  NOVA_START_SCRIPT,
} from "@/lib/nova-personality";
import { novaSessionTools } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const DEFAULT_AVATAR_ID = "music-superstar";
const SESSION_DURATION_SECONDS = 300;
const READY_TIMEOUT_MS = 55_000;
const POLL_INTERVAL_MS = 1_000;

const PRESET_AVATAR_IDS = [
  "game-character",
  "music-superstar",
  "game-character-man",
  "cat-character",
  "influencer",
  "tennis-coach",
  "human-resource",
  "fashion-designer",
  "cooking-teacher",
] as const satisfies ReadonlyArray<
  RealtimeSessionCreateParams.RunwayPreset["presetId"]
>;

type PresetAvatarId = (typeof PRESET_AVATAR_IDS)[number];

const presetAvatarIds = new Set<string>(PRESET_AVATAR_IDS);

const avatarIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

const bodySchema = z
  .object({
    avatarId: avatarIdSchema.optional(),
    avatarType: z.enum(["runway-preset", "custom"]).optional(),
  })
  .strict();

const cancelBodySchema = z
  .object({
    sessionId: z.string().trim().min(1).max(256),
  })
  .strict();

const runwayKeySchema = z
  .string({ required_error: "RUNWAYML_API_SECRET is required." })
  .trim()
  .regex(
    /^key_[a-fA-F0-9]{128}$/,
    "RUNWAYML_API_SECRET must use the key_ plus 128 hexadecimal format.",
  );

interface ConnectResponse extends SessionCredentials {
  avatarId: string;
}

export async function DELETE(request: Request) {
  const apiKeyResult = runwayKeySchema.safeParse(
    process.env.RUNWAYML_API_SECRET,
  );
  if (!apiKeyResult.success) {
    return Response.json(
      { error: apiKeyResult.error.issues[0]?.message ?? "Runway is not configured." },
      { status: 500 },
    );
  }

  const bodyResult = cancelBodySchema.safeParse(await readJsonBody(request));
  if (!bodyResult.success) {
    return Response.json(
      { error: "A valid sessionId is required." },
      { status: 400 },
    );
  }

  const baseURL = readOptionalUrl("RUNWAYML_BASE_URL");
  if (baseURL instanceof Response) return baseURL;

  const client = new Runway({
    apiKey: apiKeyResult.data,
    ...(baseURL ? { baseURL } : {}),
  });

  try {
    await client.realtimeSessions.delete(bodyResult.data.sessionId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[avatar/connect] Session cancellation failed:", error);
    return Response.json(
      { error: "Unable to cancel the Nova session." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const apiKeyResult = runwayKeySchema.safeParse(
    process.env.RUNWAYML_API_SECRET,
  );
  if (!apiKeyResult.success) {
    return Response.json(
      { error: apiKeyResult.error.issues[0]?.message ?? "Runway is not configured." },
      { status: 500 },
    );
  }

  const bodyResult = bodySchema.safeParse(await readJsonBody(request));
  if (!bodyResult.success) {
    return Response.json(
      { error: "Invalid session request.", details: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  const baseURL = readOptionalUrl("RUNWAYML_BASE_URL");
  if (baseURL instanceof Response) return baseURL;

  const environmentAvatarId = process.env.RUNWAY_AVATAR_ID?.trim();
  const environmentAvatarIdResult = environmentAvatarId
    ? avatarIdSchema.safeParse(environmentAvatarId)
    : undefined;
  if (environmentAvatarIdResult && !environmentAvatarIdResult.success) {
    return Response.json(
      { error: "RUNWAY_AVATAR_ID contains unsupported characters." },
      { status: 500 },
    );
  }

  const environmentAvatarTypeResult = readAvatarType(
    process.env.RUNWAY_AVATAR_TYPE,
  );
  if (!environmentAvatarTypeResult.success) {
    return Response.json(
      {
        error:
          "RUNWAY_AVATAR_TYPE must be preset, runway-preset, or custom.",
      },
      { status: 500 },
    );
  }

  const configuredAvatarId =
    environmentAvatarIdResult?.data ||
    bodyResult.data.avatarId ||
    DEFAULT_AVATAR_ID;
  const configuredAvatarType =
    environmentAvatarTypeResult.value ??
    bodyResult.data.avatarType;

  let avatar: RealtimeSessionCreateParams["avatar"];
  try {
    avatar = resolveAvatar(configuredAvatarId, configuredAvatarType);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid avatar." },
      { status: 400 },
    );
  }

  const client = new Runway({
    apiKey: apiKeyResult.data,
    ...(baseURL ? { baseURL } : {}),
  });

  let sessionId: string | undefined;
  try {
    const created = await client.realtimeSessions.create({
      model: "gwm1_avatars",
      avatar,
      maxDuration: SESSION_DURATION_SECONDS,
      // Runway preset avatars reject per-session persona overrides. Custom
      // avatars support them, so keep Nova's script there and let presets use
      // their built-in personality plus the explicit tool descriptions.
      ...(avatar.type === "custom"
        ? {
            personality: NOVA_PERSONALITY,
            startScript: NOVA_START_SCRIPT,
          }
        : {}),
      tools: novaSessionTools,
    });
    sessionId = created.id;

    const sessionKey = await pollUntilReady(
      client,
      sessionId,
      request.signal,
    );
    const consumed = await consumeSession({
      sessionId,
      sessionKey,
      ...(baseURL ? { baseUrl: baseURL } : {}),
    });

    const response: ConnectResponse = {
      sessionId,
      avatarId: configuredAvatarId,
      serverUrl: consumed.url,
      token: consumed.token,
      roomName: consumed.roomName,
    };

    return Response.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (sessionId) {
      await client.realtimeSessions.delete(sessionId).catch((cleanupError) => {
        console.error("[avatar/connect] Session cleanup failed:", cleanupError);
      });
    }

    console.error("[avatar/connect] Session setup failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create the Nova session.",
      },
      { status: request.signal.aborted ? 499 : 502 },
    );
  }
}

async function pollUntilReady(
  client: Runway,
  sessionId: string,
  signal: AbortSignal,
) {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal.aborted) {
      throw new Error("Session request was cancelled.");
    }

    const session = await client.realtimeSessions.retrieve(sessionId, {
      signal,
    });

    if (session.status === "READY") return session.sessionKey;
    if (session.status === "FAILED") {
      throw new Error(`Runway session failed: ${session.failure}`);
    }
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      throw new Error(
        `Runway session ${session.status.toLowerCase()} before becoming ready.`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Runway session did not become ready within 55 seconds.");
}

function resolveAvatar(
  avatarId: string,
  requestedType?: "runway-preset" | "custom",
): RealtimeSessionCreateParams["avatar"] {
  const type =
    requestedType ??
    (presetAvatarIds.has(avatarId) ? "runway-preset" : "custom");

  if (type === "custom") {
    return { type, avatarId };
  }

  if (!presetAvatarIds.has(avatarId)) {
    throw new Error(`Unknown Runway preset avatar: ${avatarId}`);
  }

  return { type, presetId: avatarId as PresetAvatarId };
}

function readAvatarType(value: string | undefined):
  | {
      success: true;
      value?: "runway-preset" | "custom";
    }
  | { success: false } {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return { success: true };
  if (normalized === "preset" || normalized === "runway-preset") {
    return { success: true, value: "runway-preset" };
  }
  if (normalized === "custom") {
    return { success: true, value: "custom" };
  }
  return { success: false };
}

function readOptionalUrl(name: string): string | undefined | Response {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  const parsed = z.string().url().safeParse(value);
  if (parsed.success) return parsed.data.replace(/\/$/, "");
  return Response.json({ error: `${name} must be a valid URL.` }, { status: 500 });
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

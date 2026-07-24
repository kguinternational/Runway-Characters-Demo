"use server";

import Runway from "@runwayml/sdk";
import {
  consumeSession,
  pollUntilReady,
} from "@runwayml/avatars-react/api";

import { NOVA_PERSONALITY, NOVA_START_SCRIPT } from "@/lib/avatar";
import { sessionTools } from "@/lib/tools";

export async function createAvatarSession(avatarId: string) {
  const runway = new Runway();
  const { id: sessionId } = await runway.realtimeSessions.create({
    model: "gwm1_avatars",
    avatar: { type: "custom", avatarId },
    maxDuration: 300,
    personality: NOVA_PERSONALITY,
    startScript: NOVA_START_SCRIPT,
    tools: sessionTools,
  });

  const { sessionKey } = await pollUntilReady({
    sessionId,
    apiKey: process.env.RUNWAYML_API_SECRET!,
  });

  const credentials = await consumeSession({ sessionId, sessionKey });

  return {
    sessionId,
    serverUrl: credentials.url,
    token: credentials.token,
    roomName: credentials.roomName,
  };
}

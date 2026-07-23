"use server";

import Runway from "@runwayml/sdk";
import { pollUntilReady } from "@runwayml/avatars-react/api";

import { sessionTools } from "@/lib/tools";

const runway = new Runway();

export async function createAvatarSession(avatarId: string) {
  const { id: sessionId } = await runway.realtimeSessions.create({
    model: "gwm1_avatars",
    avatar: { type: "custom", avatarId },
    maxDuration: 300,
    tools: sessionTools,
  });

  return pollUntilReady({
    sessionId,
    apiKey: process.env.RUNWAYML_API_SECRET!,
  });
}

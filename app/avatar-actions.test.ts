import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  consumeSession: vi.fn(),
  pollUntilReady: vi.fn(),
}));

vi.mock("@runwayml/sdk", () => ({
  default: class MockRunway {
    realtimeSessions = { create: mocks.create };
  },
}));

vi.mock("@runwayml/avatars-react/api", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@runwayml/avatars-react/api")
  >();
  return {
    ...actual,
    consumeSession: mocks.consumeSession,
    pollUntilReady: mocks.pollUntilReady,
  };
});

import { createAvatarSession } from "@/app/avatar-actions";
import { NOVA_PERSONALITY, NOVA_START_SCRIPT } from "@/lib/avatar";

describe("createAvatarSession", () => {
  beforeEach(() => {
    vi.stubEnv("RUNWAYML_API_SECRET", "mock-key");
    mocks.create.mockReset();
    mocks.consumeSession.mockReset();
    mocks.pollUntilReady.mockReset();
  });

  it("creates and consumes the custom avatar session on the server", async () => {
    mocks.create.mockResolvedValue({ id: "session-123" });
    mocks.pollUntilReady.mockResolvedValue({
      sessionId: "session-123",
      sessionKey: "session-key",
    });
    mocks.consumeSession.mockResolvedValue({
      url: "wss://runway.example",
      token: "livekit-token",
      roomName: "room-123",
    });

    await expect(createAvatarSession("nova-avatar")).resolves.toEqual({
      sessionId: "session-123",
      serverUrl: "wss://runway.example",
      token: "livekit-token",
      roomName: "room-123",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gwm1_avatars",
        avatar: { type: "custom", avatarId: "nova-avatar" },
        maxDuration: 300,
        personality: NOVA_PERSONALITY,
        startScript: NOVA_START_SCRIPT,
      }),
    );
    expect(mocks.pollUntilReady).toHaveBeenCalledWith({
      sessionId: "session-123",
      apiKey: "mock-key",
    });
    expect(mocks.consumeSession).toHaveBeenCalledWith({
      sessionId: "session-123",
      sessionKey: "session-key",
    });
  });
});

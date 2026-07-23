import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
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
  return { ...actual, pollUntilReady: mocks.pollUntilReady };
});

import { createAvatarSession } from "@/app/avatar-actions";

describe("createAvatarSession", () => {
  beforeEach(() => {
    vi.stubEnv("RUNWAYML_API_SECRET", "mock-key");
    mocks.create.mockReset();
    mocks.pollUntilReady.mockReset();
  });

  it("uses the custom support avatar and returns one-use session credentials", async () => {
    mocks.create.mockResolvedValue({ id: "session-123" });
    mocks.pollUntilReady.mockResolvedValue({
      sessionId: "session-123",
      sessionKey: "session-key",
    });

    await expect(createAvatarSession("nova-avatar")).resolves.toEqual({
      sessionId: "session-123",
      sessionKey: "session-key",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gwm1_avatars",
        avatar: { type: "custom", avatarId: "nova-avatar" },
        maxDuration: 300,
      }),
    );
    expect(mocks.pollUntilReady).toHaveBeenCalledWith({
      sessionId: "session-123",
      apiKey: "mock-key",
    });
  });
});

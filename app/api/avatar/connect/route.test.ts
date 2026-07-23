import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  retrieve: vi.fn(),
  remove: vi.fn(),
  consumeSession: vi.fn(),
}));

vi.mock("@runwayml/sdk", () => ({
  default: class MockRunway {
    realtimeSessions = {
      create: mocks.create,
      retrieve: mocks.retrieve,
      delete: mocks.remove,
    };
  },
}));

vi.mock("@runwayml/avatars-react/api", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@runwayml/avatars-react/api")
  >();
  return { ...actual, consumeSession: mocks.consumeSession };
});

import { DELETE, POST } from "@/app/api/avatar/connect/route";

const VALID_KEY = `key_${"a".repeat(128)}`;

function request(body: unknown = {}) {
  return new Request("http://localhost/api/avatar/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function cancelRequest(body: unknown) {
  return new Request("http://localhost/api/avatar/connect", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/avatar/connect", () => {
  beforeEach(() => {
    vi.stubEnv("RUNWAYML_API_SECRET", VALID_KEY);
    vi.stubEnv("RUNWAY_AVATAR_ID", "");
    vi.stubEnv("RUNWAY_AVATAR_TYPE", "");
    vi.stubEnv("RUNWAYML_BASE_URL", "");
    mocks.create.mockReset();
    mocks.retrieve.mockReset();
    mocks.remove.mockReset();
    mocks.consumeSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates, polls, and consumes a fresh preset session server-side", async () => {
    mocks.create.mockResolvedValue({ id: "session-123" });
    mocks.retrieve.mockResolvedValue({
      status: "READY",
      sessionKey: "one-time-session-key",
    });
    mocks.consumeSession.mockResolvedValue({
      url: "wss://avatar.example.test",
      token: "ephemeral-token",
      roomName: "session-123",
    });

    const response = await POST(request({ avatarId: "music-superstar" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toEqual({
      sessionId: "session-123",
      avatarId: "music-superstar",
      serverUrl: "wss://avatar.example.test",
      token: "ephemeral-token",
      roomName: "session-123",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gwm1_avatars",
        avatar: { type: "runway-preset", presetId: "music-superstar" },
        maxDuration: 300,
        tools: expect.arrayContaining([
          expect.objectContaining({ name: "scroll_to" }),
          expect.objectContaining({ name: "set_date_range" }),
          expect.objectContaining({ name: "get_revenue" }),
          expect.objectContaining({ name: "create_ticket" }),
        ]),
      }),
    );
    expect(mocks.create.mock.calls[0]?.[0]).not.toHaveProperty("personality");
    expect(mocks.create.mock.calls[0]?.[0]).not.toHaveProperty("startScript");
    expect(mocks.consumeSession).toHaveBeenCalledWith({
      sessionId: "session-123",
      sessionKey: "one-time-session-key",
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("keeps Nova's persona overrides for a custom original avatar", async () => {
    mocks.create.mockResolvedValue({ id: "custom-session" });
    mocks.retrieve.mockResolvedValue({
      status: "READY",
      sessionKey: "custom-session-key",
    });
    mocks.consumeSession.mockResolvedValue({
      url: "wss://avatar.example.test",
      token: "ephemeral-token",
      roomName: "custom-session",
    });

    const response = await POST(
      request({ avatarId: "original-nova-avatar", avatarType: "custom" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar: { type: "custom", avatarId: "original-nova-avatar" },
        personality: expect.stringContaining("You are Nova"),
        startScript: expect.stringContaining("I'm Nova"),
      }),
    );
  });

  it("keeps the API key requirement on the server boundary", async () => {
    vi.stubEnv("RUNWAYML_API_SECRET", "");

    const response = await POST(request());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toMatch(/RUNWAYML_API_SECRET/);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects unsupported client input before creating a session", async () => {
    const response = await POST(
      request({ avatarId: "music-superstar", unexpected: true }),
    );

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("deletes a failed session so a retake starts cleanly", async () => {
    mocks.create.mockResolvedValue({ id: "failed-session" });
    mocks.retrieve.mockResolvedValue({
      status: "FAILED",
      failure: "provisioning failed",
    });
    mocks.remove.mockResolvedValue(undefined);

    const response = await POST(request());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("provisioning failed");
    expect(mocks.remove).toHaveBeenCalledWith("failed-session");
    expect(mocks.consumeSession).not.toHaveBeenCalled();
  });

  it("cancels consumed credentials when client setup cannot finish", async () => {
    mocks.remove.mockResolvedValue(undefined);

    const response = await DELETE(
      cancelRequest({ sessionId: "consumed-session" }),
    );

    expect(response.status).toBe(204);
    expect(mocks.remove).toHaveBeenCalledWith("consumed-session");
  });
});

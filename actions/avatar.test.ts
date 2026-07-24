import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createRpcHandler: vi.fn(),
  consumeSession: vi.fn(),
  query: vi.fn(),
  mutation: vi.fn(),
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

vi.mock("@runwayml/avatars-node-rpc", () => ({
  createRpcHandler: mocks.createRpcHandler,
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class MockConvexHttpClient {
    query = mocks.query;
    mutation = mocks.mutation;
  },
}));

import { createAvatarSession } from "@/actions/avatar";
import {
  NOVA_AVATAR_ID,
  NOVA_PERSONALITY,
  NOVA_START_SCRIPT,
} from "@/lib/avatar";

type RpcOptions = {
  sessionId: string;
  onDisconnected: () => void;
  tools: {
    get_overview_insights: () => Promise<unknown>;
    get_revenue: (args: Record<string, unknown>) => Promise<unknown>;
    get_ticket_insights: () => Promise<unknown>;
    get_ticket: (args: Record<string, unknown>) => Promise<unknown>;
    create_ticket: (args: Record<string, unknown>) => Promise<unknown>;
    update_ticket_status: (args: Record<string, unknown>) => Promise<unknown>;
  };
};

describe("createAvatarSession", () => {
  beforeEach(() => {
    vi.stubEnv("RUNWAYML_API_SECRET", "mock-key");
    mocks.create.mockReset();
    mocks.createRpcHandler.mockReset();
    mocks.consumeSession.mockReset();
    mocks.query.mockReset();
    mocks.mutation.mockReset();
    mocks.pollUntilReady.mockReset();
  });

  it("creates a session and connects its server tools", async () => {
    let rpcOptions: RpcOptions | undefined;
    mocks.create.mockResolvedValue({ id: "session-123" });
    mocks.pollUntilReady.mockResolvedValue({
      sessionId: "session-123",
      sessionKey: "session-key",
    });
    mocks.createRpcHandler.mockImplementation(async (options: RpcOptions) => {
      rpcOptions = options;
      return { close: vi.fn() };
    });
    mocks.consumeSession.mockResolvedValue({
      url: "wss://runway.example",
      token: "livekit-token",
      roomName: "room-123",
    });
    const revenue = {
      total: 122_926,
      changePct: 3.3,
      dailyAverage: 4_097.53,
      peakDay: { date: "2026-07-20", amount: 5_120 },
      refundCount: 1,
      dip: { date: "2026-07-09", amount: -2_850 },
    };
    const ticket = {
      ticketId: 4_806,
      subject: "Investigate refund",
      team: "Billing",
      status: "open",
      createdAt: 1,
    };
    const ticketInsights = {
      total: 8,
      open: 5,
      closed: 3,
      byTeam: [{ team: "Billing", count: 4 }],
      topTeam: { team: "Billing", count: 4 },
      latestTicket: ticket,
    };
    mocks.query.mockImplementation(async (_query, args) => {
      if ("range" in args) return revenue;
      if ("ticketId" in args) return ticket;
      return ticketInsights;
    });
    mocks.mutation.mockImplementation(async (_mutation, args) =>
      "status" in args ? { ...ticket, status: args.status } : 4_806,
    );

    await expect(createAvatarSession()).resolves.toEqual({
      sessionId: "session-123",
      serverUrl: "wss://runway.example",
      token: "livekit-token",
      roomName: "room-123",
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gwm1_avatars",
        avatar: { type: "custom", avatarId: NOVA_AVATAR_ID },
        personality: expect.stringContaining(
          "Client tools and Page Actions — order matters",
        ),
        startScript: NOVA_START_SCRIPT,
      }),
    );
    expect(NOVA_PERSONALITY).toContain(
      "Before every click, call highlight with the exact target",
    );
    expect(NOVA_PERSONALITY).toContain(
      "Never call a destination-page target in that same response.",
    );
    expect(mocks.pollUntilReady).toHaveBeenCalledWith({
      sessionId: "session-123",
      apiKey: "mock-key",
    });
    expect(mocks.createRpcHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "mock-key",
        sessionId: "session-123",
      }),
    );
    await expect(
      rpcOptions!.tools.get_overview_insights(),
    ).resolves.toMatchObject({
      revenue: { total: 122_926 },
      support: { open: 5 },
    });
    await expect(
      rpcOptions!.tools.get_revenue({ range: "30d" }),
    ).resolves.toMatchObject({
      total: 122_926,
      dailyAverage: 4_097.53,
      refundCount: 1,
    });
    await expect(rpcOptions!.tools.get_ticket_insights()).resolves.toEqual(
      ticketInsights,
    );
    await expect(
      rpcOptions!.tools.get_ticket({ ticketId: 4_806 }),
    ).resolves.toEqual({ ticket });
    await expect(
      rpcOptions!.tools.create_ticket({
        subject: "Investigate refund",
        team: "Billing",
      }),
    ).resolves.toEqual({ ticketId: 4_806 });
    await expect(
      rpcOptions!.tools.update_ticket_status({
        ticketId: 4_806,
        status: "closed",
      }),
    ).resolves.toMatchObject({ ticketId: 4_806, status: "closed" });
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), { range: "30d" });
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), {
      ticketId: 4_806,
    });
    expect(mocks.mutation).toHaveBeenCalledWith(expect.anything(), {
      subject: "Investigate refund",
      team: "Billing",
    });
    expect(mocks.mutation).toHaveBeenCalledWith(expect.anything(), {
      ticketId: 4_806,
      status: "closed",
    });
    expect(mocks.consumeSession).toHaveBeenCalledWith({
      sessionId: "session-123",
      sessionKey: "session-key",
    });
    rpcOptions!.onDisconnected();
  });
});

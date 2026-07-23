import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRpcHandler: vi.fn(),
  query: vi.fn(),
  mutation: vi.fn(),
  close: vi.fn(),
}));

vi.mock("@runwayml/avatars-node-rpc", () => ({
  createRpcHandler: mocks.createRpcHandler,
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class MockConvexHttpClient {
    query = mocks.query;
    mutation = mocks.mutation;
  },
}));

import { POST } from "@/app/api/avatar/rpc/route";

const VALID_KEY = `key_${"b".repeat(128)}`;

type HandlerOptions = {
  sessionId: string;
  tools: {
    get_revenue: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    create_ticket: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  onConnected: () => void;
};

function rpcRequest(signal?: AbortSignal) {
  return new Request("http://localhost/api/avatar/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "session-123" }),
    signal,
  });
}

async function readEvent(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) throw new Error("RPC stream ended before the expected event.");
    const line = decoder.decode(value).trim();
    if (line) return JSON.parse(line) as Record<string, unknown>;
  }
}

describe("POST /api/avatar/rpc", () => {
  beforeEach(() => {
    vi.stubEnv("RUNWAYML_API_SECRET", VALID_KEY);
    vi.stubEnv("CONVEX_URL", "https://convex.example.test");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
    vi.stubEnv("RUNWAYML_BASE_URL", "");
    mocks.createRpcHandler.mockReset();
    mocks.query.mockReset();
    mocks.mutation.mockReset();
    mocks.close.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("opens one RPC handler and streams real Convex tool results", async () => {
    let options: HandlerOptions | undefined;
    mocks.createRpcHandler.mockImplementation(async (value: HandlerOptions) => {
      options = value;
      value.onConnected();
      return { connected: true, close: mocks.close };
    });
    mocks.query.mockResolvedValue({
      total: 122_821,
      changePct: 3.6,
      dip: { date: "2026-06-30", amount: -2_850, refunded: true },
      series: [],
    });
    mocks.mutation.mockResolvedValue(4_805);

    const abort = new AbortController();
    const response = await POST(rpcRequest(abort.signal));
    const reader = response.body!.getReader();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(await readEvent(reader)).toEqual(
      expect.objectContaining({
        type: "connected",
        sessionId: "session-123",
      }),
    );

    expect(options?.sessionId).toBe("session-123");
    const revenue = await options!.tools.get_revenue({ range: "30d" });
    expect(revenue).toEqual({
      total: 122_821,
      changePct: 3.6,
      dip: { date: "2026-06-30", amount: -2_850, refunded: true },
    });
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), { range: "30d" });
    expect(await readEvent(reader)).toEqual(
      expect.objectContaining({
        type: "tool",
        tool: "get_revenue",
        result: revenue,
      }),
    );

    const ticket = await options!.tools.create_ticket({
      subject: "Investigate refund in the 30-day revenue report",
      team: "Billing",
    });
    expect(ticket).toEqual({ ticketId: 4_805 });
    expect(mocks.mutation).toHaveBeenCalledWith(expect.anything(), {
      subject: "Investigate refund in the 30-day revenue report",
      team: "Billing",
    });
    expect(await readEvent(reader)).toEqual(
      expect.objectContaining({
        type: "tool",
        tool: "create_ticket",
        result: { ticketId: 4_805 },
      }),
    );

    abort.abort();
    await vi.waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
  });

  it("does not open an RPC connection without the server-only key", async () => {
    vi.stubEnv("RUNWAYML_API_SECRET", "");

    const response = await POST(rpcRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toMatch(/RUNWAYML_API_SECRET/);
    expect(mocks.createRpcHandler).not.toHaveBeenCalled();
  });

  it("rejects malformed session IDs before connecting", async () => {
    const response = await POST(
      new Request("http://localhost/api/avatar/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createRpcHandler).not.toHaveBeenCalled();
  });
});

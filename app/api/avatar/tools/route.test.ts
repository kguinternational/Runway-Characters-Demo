import { describe, expect, it, vi } from "vitest";

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

import { POST } from "@/app/api/avatar/tools/route";

type RpcOptions = {
  sessionId: string;
  onConnected: () => void;
  tools: {
    get_revenue: (args: Record<string, unknown>) => Promise<unknown>;
    create_ticket: (args: Record<string, unknown>) => Promise<unknown>;
  };
};

describe("POST /api/avatar/tools", () => {
  it("connects mocked backend tools to the real Convex function references", async () => {
    let options: RpcOptions | undefined;
    mocks.createRpcHandler.mockImplementation(async (value: RpcOptions) => {
      options = value;
      value.onConnected();
      return { close: mocks.close };
    });
    mocks.query.mockResolvedValue({
      total: 122_926,
      changePct: 3.3,
      dip: { date: "2026-07-09", amount: -2_850 },
    });
    mocks.mutation.mockResolvedValue(4_806);

    const response = await POST(
      new Request("http://localhost/api/avatar/tools", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-123" }),
      }),
    );
    const reader = response.body!.getReader();
    const firstChunk = await reader.read();

    expect(new TextDecoder().decode(firstChunk.value)).toContain("connected");
    expect(options?.sessionId).toBe("session-123");
    await expect(options!.tools.get_revenue({ range: "30d" })).resolves.toMatchObject({
      total: 122_926,
    });
    await expect(
      options!.tools.create_ticket({ subject: "Investigate refund", team: "Billing" }),
    ).resolves.toEqual({ ticketId: 4_806 });
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), { range: "30d" });
    expect(mocks.mutation).toHaveBeenCalledWith(expect.anything(), {
      subject: "Investigate refund",
      team: "Billing",
    });

    await reader.cancel();
    expect(mocks.close).toHaveBeenCalled();
  });
});

import { createRpcHandler, type RpcHandler } from "@runwayml/avatars-node-rpc";
import { ConvexHttpClient } from "convex/browser";

import { createTicketRef, getRevenueRef } from "@/lib/convex-functions";
import type { RevenueRange } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const { sessionId } = (await request.json()) as { sessionId: string };
  const convex = new ConvexHttpClient(
    process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
  );
  const encoder = new TextEncoder();
  let rpc: RpcHandler | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      rpc = await createRpcHandler({
        apiKey: process.env.RUNWAYML_API_SECRET!,
        sessionId,
        tools: {
          get_revenue: async (args) => {
            const revenue = await convex.query(getRevenueRef, {
              range: args.range as RevenueRange,
            });
            return {
              total: revenue.total,
              changePct: revenue.changePct,
              dip: revenue.dip,
            };
          },
          create_ticket: async (args) => {
            const ticketId = await convex.mutation(createTicketRef, {
              subject: String(args.subject),
              team: String(args.team),
            });
            return { ticketId };
          },
        },
        onConnected: () => controller.enqueue(encoder.encode("connected\n")),
        onDisconnected: () => controller.close(),
        onError: (error) =>
          controller.enqueue(encoder.encode(`error: ${error.message}\n`)),
      });
    },
    cancel() {
      return rpc?.close();
    },
  });

  request.signal.addEventListener("abort", () => void rpc?.close(), {
    once: true,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

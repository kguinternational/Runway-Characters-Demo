import { createRpcHandler } from "@runwayml/avatars-node-rpc";
import { ConvexHttpClient } from "convex/browser";

import { createTicketRef, getRevenueRef } from "@/lib/convex-functions";
import type { RevenueRange } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { sessionId } = (await request.json()) as { sessionId: string };
  const convex = new ConvexHttpClient(
    process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
  );
  const { promise: disconnected, resolve: finish } =
    Promise.withResolvers<void>();

  const rpc = await createRpcHandler({
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
    onDisconnected: finish,
    onError: (error) => console.error("Runway RPC error:", error.message),
  });

  if (request.signal.aborted) finish();
  request.signal.addEventListener("abort", () => finish(), { once: true });

  await disconnected;
  await rpc.close();

  return new Response(null, { status: 204 });
}

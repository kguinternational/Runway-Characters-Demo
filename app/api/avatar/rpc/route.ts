import { createRpcHandler, type RpcHandler } from "@runwayml/avatars-node-rpc";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import {
  createTicketRef,
  getRevenueRef,
} from "@/lib/convex-functions";
import {
  createTicketArgsSchema,
  getRevenueArgsSchema,
} from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STREAM_LIFETIME_MS = 295_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

const bodySchema = z
  .object({
    sessionId: z.string().trim().min(1).max(256),
  })
  .strict();

const runwayKeySchema = z
  .string({ required_error: "RUNWAYML_API_SECRET is required." })
  .trim()
  .regex(
    /^key_[a-fA-F0-9]{128}$/,
    "RUNWAYML_API_SECRET must use the key_ plus 128 hexadecimal format.",
  );

type RpcEvent =
  | {
      type: "connected";
      sessionId: string;
      at: string;
    }
  | {
      type: "tool";
      tool: "get_revenue" | "create_ticket";
      result: Record<string, unknown>;
      at: string;
    }
  | {
      type: "error";
      code: string;
      message: string;
      tool?: string;
      at: string;
    };

export async function POST(request: Request) {
  const apiKeyResult = runwayKeySchema.safeParse(
    process.env.RUNWAYML_API_SECRET,
  );
  if (!apiKeyResult.success) {
    return Response.json(
      { error: apiKeyResult.error.issues[0]?.message ?? "Runway is not configured." },
      { status: 500 },
    );
  }

  const convexUrl =
    process.env.CONVEX_URL?.trim() ||
    process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const convexUrlResult = z.string().url().safeParse(convexUrl);
  if (!convexUrlResult.success) {
    return Response.json(
      { error: "CONVEX_URL or NEXT_PUBLIC_CONVEX_URL must be configured." },
      { status: 500 },
    );
  }

  const baseUrlResult = parseOptionalUrl(process.env.RUNWAYML_BASE_URL);
  if (!baseUrlResult.success) {
    return Response.json(
      { error: "RUNWAYML_BASE_URL must be a valid URL." },
      { status: 500 },
    );
  }

  const bodyResult = bodySchema.safeParse(await readJsonBody(request));
  if (!bodyResult.success) {
    return Response.json(
      { error: "A valid sessionId is required." },
      { status: 400 },
    );
  }

  const { sessionId } = bodyResult.data;
  const convex = new ConvexHttpClient(convexUrlResult.data);
  const encoder = new TextEncoder();
  let handler: RpcHandler | null = null;
  let closeStream: (reason: string) => Promise<void> = async () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let state: "open" | "closing" | "closed" = "open";
      const timers: {
        heartbeat?: ReturnType<typeof setInterval>;
        lifetime?: ReturnType<typeof setTimeout>;
      } = {};

      const send = (event: RpcEvent) => {
        if (state !== "open") return;
        try {
          controller.enqueue(
            encoder.encode(`${JSON.stringify(event)}\n`),
          );
        } catch {
          void closeStream("stream_write_failed");
        }
      };

      closeStream = async (reason: string) => {
        if (state !== "open") return;
        state = "closing";
        if (timers.heartbeat) clearInterval(timers.heartbeat);
        if (timers.lifetime) clearTimeout(timers.lifetime);
        request.signal.removeEventListener("abort", handleAbort);

        const activeHandler = handler;
        handler = null;
        if (activeHandler) {
          try {
            await activeHandler.close();
          } catch (error) {
            console.error(
              `[avatar/rpc] Failed to close handler (${reason}):`,
              error,
            );
          }
        }

        state = "closed";
        try {
          controller.close();
        } catch {
          // The browser may already have cancelled the stream.
        }
      };

      function handleAbort() {
        void closeStream("browser_aborted");
      }

      const runTool = async <T extends Record<string, unknown>>(
        tool: "get_revenue" | "create_ticket",
        action: () => Promise<T>,
      ) => {
        const result = await action();
        send({
          type: "tool",
          tool,
          result,
          at: new Date().toISOString(),
        });
        return result;
      };

      request.signal.addEventListener("abort", handleAbort, { once: true });

      timers.heartbeat = setInterval(() => {
        if (state !== "open") return;
        try {
          // A blank NDJSON line keeps proxies from treating the stream as idle.
          controller.enqueue(encoder.encode("\n"));
        } catch {
          void closeStream("heartbeat_failed");
        }
      }, HEARTBEAT_INTERVAL_MS);

      timers.lifetime = setTimeout(() => {
        send({
          type: "error",
          code: "RPC_STREAM_TIMEOUT",
          message: "The five-minute Nova session has ended. Start a new call to continue.",
          at: new Date().toISOString(),
        });
        void closeStream("session_timeout");
      }, STREAM_LIFETIME_MS);

      void (async () => {
        try {
          const createdHandler = await createRpcHandler({
            apiKey: apiKeyResult.data,
            sessionId,
            ...(baseUrlResult.value
              ? { baseUrl: baseUrlResult.value }
              : {}),
            tools: {
              get_revenue: async (rawArgs) => {
                const args = getRevenueArgsSchema.parse(rawArgs);
                return runTool(
                  "get_revenue",
                  async () => {
                    const revenue = await convex.query(getRevenueRef, args);
                    return {
                      total: revenue.total,
                      changePct: revenue.changePct,
                      dip: revenue.dip,
                    };
                  },
                );
              },
              create_ticket: async (rawArgs) => {
                const args = createTicketArgsSchema.parse(rawArgs);
                return runTool(
                  "create_ticket",
                  async () => {
                    const ticketId = await convex.mutation(
                      createTicketRef,
                      args,
                    );
                    return { ticketId };
                  },
                );
              },
            },
            onConnected: () => {
              send({
                type: "connected",
                sessionId,
                at: new Date().toISOString(),
              });
            },
            onDisconnected: () => {
              if (state !== "open") return;
              send({
                type: "error",
                code: "RPC_DISCONNECTED",
                message: "Nova's server-tool connection ended.",
                at: new Date().toISOString(),
              });
              void closeStream("rpc_disconnected");
            },
            onError: (error) => {
              send({
                type: "error",
                code: "RPC_TOOL_ERROR",
                message: toErrorMessage(error),
                at: new Date().toISOString(),
              });
            },
          });

          handler = createdHandler;
          if (state !== "open") {
            await createdHandler.close();
          }
        } catch (error) {
          console.error("[avatar/rpc] Connection failed:", error);
          send({
            type: "error",
            code: "RPC_CONNECT_FAILED",
            message: toErrorMessage(error),
            at: new Date().toISOString(),
          });
          await closeStream("rpc_connect_failed");
        }
      })();
    },
    cancel() {
      return closeStream("reader_cancelled");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function parseOptionalUrl(value: string | undefined): {
  success: boolean;
  value?: string;
} {
  const normalized = value?.trim();
  if (!normalized) return { success: true };
  const parsed = z.string().url().safeParse(normalized);
  return parsed.success
    ? { success: true, value: parsed.data.replace(/\/$/, "") }
    : { success: false };
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }
  return error instanceof Error ? error.message : "Unknown RPC error.";
}

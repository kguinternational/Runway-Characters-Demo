import { validateClientToolArgs } from "@runwayml/avatars-react/api";
import { describe, expect, it } from "vitest";

import {
  backendRpcTools,
  clientEventTools,
  novaSessionTools,
  openPanelTool,
  setDateRangeTool,
} from "@/lib/tools";

describe("Nova tool contract", () => {
  it("includes all three Page Actions with model-facing targets", () => {
    for (const name of ["click", "scroll_to", "highlight"]) {
      const tool = novaSessionTools.find((candidate) => candidate.name === name);
      expect(tool).toMatchObject({ type: "client_event", name });
      expect(tool?.parameters?.some((parameter) => parameter.name === "target")).toBe(
        true,
      );
    }
  });

  it("keeps Zod validation and explicit client-tool parameters in sync", () => {
    expect(
      validateClientToolArgs(setDateRangeTool, { range: "30d" }),
    ).toEqual({ range: "30d" });
    expect(validateClientToolArgs(setDateRangeTool, { range: "31d" })).toBeNull();
    expect(
      validateClientToolArgs(openPanelTool, {
        title: "Ticket #4805 created",
        body: "Billing owns the refund investigation.",
      }),
    ).toEqual({
      title: "Ticket #4805 created",
      body: "Billing owns the refund investigation.",
    });

    expect(clientEventTools).toHaveLength(2);
    expect(clientEventTools[0]?.parameters?.[0]).toMatchObject({
      name: "range",
      enum: ["7d", "30d", "90d"],
      required: true,
    });
  });

  it("declares database-backed RPC tools with bounded timeouts", () => {
    expect(backendRpcTools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "backend_rpc",
          name: "get_revenue",
          timeoutSeconds: 8,
        }),
        expect.objectContaining({
          type: "backend_rpc",
          name: "create_ticket",
          timeoutSeconds: 8,
        }),
      ]),
    );
  });
});

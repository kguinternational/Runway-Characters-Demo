"use client";

import { useClientEvent } from "@runwayml/avatars-react";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { openPanelTool, setDateRangeTool } from "@/lib/tools";

export function ClientToolHandlers() {
  const { openPanel, setRange } = useDashboard();

  useClientEvent(setDateRangeTool, ({ range }) => setRange(range));
  useClientEvent(openPanelTool, ({ title, body }) => openPanel({ title, body }));

  return null;
}

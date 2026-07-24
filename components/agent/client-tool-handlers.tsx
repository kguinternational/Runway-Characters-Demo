"use client";

import { useClientEvent } from "@runwayml/avatars-react";

import { useDashboard } from "@/components/layout/dashboard-provider";
import {
  filterTicketsTool,
  openPanelTool,
  setDateRangeTool,
} from "@/lib/tools";

export function ClientToolHandlers() {
  const { openPanel, setRange, setTicketFilter } = useDashboard();

  useClientEvent(setDateRangeTool, ({ range }) => setRange(range));
  useClientEvent(filterTicketsTool, ({ filter }) => setTicketFilter(filter));
  useClientEvent(openPanelTool, ({ title, body }) => openPanel({ title, body }));

  return null;
}

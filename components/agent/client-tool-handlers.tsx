"use client";

import { useClientEvent } from "@runwayml/avatars-react";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { setDateRangeTool } from "@/lib/tools";

export function ClientToolHandlers() {
  const { setRange } = useDashboard();
  useClientEvent(setDateRangeTool, ({ range }) => setRange(range));

  return null;
}

"use client";

import { PageActions, useClientEvent } from "@runwayml/avatars-react";
import { useRouter } from "next/navigation";

import { useDashboard } from "@/components/layout/dashboard-provider";
import { openPanelTool, setDateRangeTool } from "@/lib/tools";

export function ClientToolHandlers() {
  const router = useRouter();
  const { setRange, openPanel } = useDashboard();

  useClientEvent(setDateRangeTool, ({ range }) => {
    setRange(range);
    router.push("/revenue");
  });

  useClientEvent(openPanelTool, openPanel);

  return <PageActions />;
}

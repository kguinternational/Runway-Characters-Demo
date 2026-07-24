"use client";

import { createContext, useContext, useState } from "react";

import type {
  InfoPanelState,
  RevenueRange,
  TicketFilter,
} from "@/lib/types";

type DashboardContextValue = {
  range: RevenueRange;
  setRange: (range: RevenueRange) => void;
  ticketFilter: TicketFilter;
  setTicketFilter: (filter: TicketFilter) => void;
  panel: InfoPanelState | null;
  openPanel: (panel: InfoPanelState) => void;
  closePanel: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [range, setRange] = useState<RevenueRange>("90d");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");
  const [panel, setPanel] = useState<InfoPanelState | null>(null);

  return (
    <DashboardContext.Provider
      value={{
        range,
        setRange,
        ticketFilter,
        setTicketFilter,
        panel,
        openPanel: setPanel,
        closePanel: () => setPanel(null),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider.");
  }
  return context;
}

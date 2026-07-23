"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, useContext, useMemo, useState } from "react";

import { ConfigurationRequired } from "@/components/layout/configuration-required";
import type { InfoPanelState, RevenueRange } from "@/lib/types";

type DashboardContextValue = {
  range: RevenueRange;
  setRange: (range: RevenueRange) => void;
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
  const [panel, setPanel] = useState<InfoPanelState | null>(null);
  const convex = useMemo(
    () =>
      process.env.NEXT_PUBLIC_CONVEX_URL
        ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)
        : null,
    [],
  );

  if (!convex) return <ConfigurationRequired />;

  return (
    <ConvexProvider client={convex}>
      <DashboardContext.Provider
        value={{
          range,
          setRange,
          panel,
          openPanel: setPanel,
          closePanel: () => setPanel(null),
        }}
      >
        {children}
      </DashboardContext.Provider>
    </ConvexProvider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider.");
  }
  return context;
}

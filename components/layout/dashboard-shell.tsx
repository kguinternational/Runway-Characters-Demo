"use client";

import { AgentCard } from "@/components/agent/agent-card";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { InfoPanel } from "@/components/overlays/info-panel";
import { useDashboard } from "@/components/layout/dashboard-provider";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { panel, closePanel } = useDashboard();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="min-h-screen pb-[430px] md:ml-[218px] lg:pb-16">
        <TopBar />
        <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-6 sm:px-7 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
      <AgentCard />
      <InfoPanel panel={panel} onClose={closePanel} />
    </div>
  );
}

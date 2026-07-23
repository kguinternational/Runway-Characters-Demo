import { DatabaseZap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export function ConfigurationRequired() {
  return (
    <main className="relative grid min-h-screen place-items-center px-5 py-16">
      <div className="dashboard-grid pointer-events-none absolute inset-0 opacity-35" />
      <Card className="relative z-10 w-full max-w-2xl overflow-hidden">
        <div className="p-7 sm:p-9">
          <StatusPill tone="warning">
            <DatabaseZap className="size-3" />
            Setup required
          </StatusPill>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.06em]">
            Connect Convex.
          </h1>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Run <code className="font-mono">pnpm demo</code>, then reload this page.
            The demo intentionally uses live data instead of fallbacks.
          </p>
        </div>
      </Card>
    </main>
  );
}

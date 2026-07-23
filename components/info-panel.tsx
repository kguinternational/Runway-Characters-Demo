"use client";

import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InfoPanelState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InfoPanel({
  panel,
  onClose,
}: {
  panel: InfoPanelState | null;
  onClose: () => void;
}) {
  return (
    <>
      <button
        aria-label="Close information panel"
        tabIndex={panel ? 0 : -1}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-20 bg-[#090c0b]/20 backdrop-blur-[1px] transition-opacity duration-300",
          panel ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!panel}
        aria-label={panel?.title ?? "Nova information panel"}
        className={cn(
          "fixed right-3 top-20 z-[45] flex max-h-[calc(100vh-6rem)] w-[calc(100%-1.5rem)] max-w-[390px] flex-col overflow-y-auto rounded-[1.6rem] border border-white/10 bg-[#111615] p-6 text-[#f5f3e9] shadow-[-20px_24px_80px_rgba(5,8,7,0.3)] transition-transform duration-500 ease-[cubic-bezier(.22,.8,.26,1)] sm:right-5 sm:p-7 lg:right-[390px]",
          panel
            ? "translate-x-0"
            : "translate-x-[110%] lg:translate-x-[210%]",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#aab3ae]">
            <span className="live-dot size-2 rounded-full bg-[var(--accent)]" />
            Nova action
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#aab3ae] hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close panel"
            tabIndex={panel ? 0 : -1}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="my-8">
          <div className="mb-7 grid size-14 place-items-center rounded-2xl bg-[var(--accent)] text-[#11170f] shadow-[0_16px_44px_rgba(201,244,79,0.22)]">
            <CheckCircle2 className="size-7" />
          </div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#8e9994]">
            Completed in real time
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.04] tracking-[-0.05em]">
            {panel?.title ?? "Action complete"}
          </h2>
          <p className="mt-5 text-[1.02rem] leading-7 text-[#b7c0bb]">
            {panel?.body ?? "Nova will place live action details here."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.15em] text-[#84908a]">
            Tool source
          </p>
          <p className="mt-2 text-sm text-[#d9dfdc]">
            Custom client tool · <span className="font-mono text-[var(--accent)]">open_panel</span>
          </p>
        </div>
      </aside>
    </>
  );
}

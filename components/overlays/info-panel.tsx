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
        id="close-info-panel-backdrop"
        data-avatar-target="close-info-panel-backdrop"
        aria-label="Close information panel"
        tabIndex={panel ? 0 : -1}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-20 bg-[#090c0b]/20 backdrop-blur-[1px] transition-opacity",
          panel ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        id="info-panel"
        data-avatar-target="info-panel"
        aria-hidden={!panel}
        className={cn(
          "fixed right-3 top-20 z-[45] w-[calc(100%-1.5rem)] max-w-[390px] rounded-[1.6rem] border border-white/10 bg-[#111615] p-6 text-[#f5f3e9] shadow-[-20px_24px_80px_rgba(5,8,7,0.3)] transition-transform sm:right-5 lg:right-[390px]",
          panel ? "translate-x-0" : "translate-x-[115%] lg:translate-x-[210%]",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[#aab3ae]">
            Dashboard detail
          </span>
          <Button
            id="close-info-panel"
            data-avatar-target="close-info-panel"
            variant="ghost"
            size="icon"
            className="text-[#aab3ae] hover:bg-white/10 hover:text-white"
            onClick={onClose}
            tabIndex={panel ? 0 : -1}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>
        <CheckCircle2 className="mt-8 size-10 text-[var(--accent)]" />
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em]">
          {panel?.title ?? "Details"}
        </h2>
        <p className="mt-4 text-[1rem] leading-7 text-[#b7c0bb]">
          {panel?.body ?? ""}
        </p>
      </aside>
    </>
  );
}

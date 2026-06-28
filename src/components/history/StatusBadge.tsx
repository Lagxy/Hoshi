const STYLES: Record<string, { label: string; cls: string }> = {
  completed: { label: "COMPLETED", cls: "text-gain border-gain/40 bg-gain/5" },
  failed: { label: "FAILED", cls: "text-loss border-loss/40 bg-loss/5" },
  interrupted: {
    label: "INTERRUPTED",
    cls: "text-loss border-loss/40 bg-loss/5",
  },
  cancelled: { label: "CANCELLED", cls: "text-warn border-warn/40 bg-warn/5" },
  running_stage1: { label: "RUNNING", cls: "text-cyan border-cyan/40 bg-cyan/5" },
  running_stage2: { label: "RUNNING", cls: "text-cyan border-cyan/40 bg-cyan/5" },
  queued: { label: "QUEUED", cls: "text-fg-dim border-line" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? { label: status.toUpperCase(), cls: "text-fg-dim border-line" };
  return (
    <span
      className={`border px-1.5 py-0.5 font-display text-[10px] font-bold tracking-[0.15em] ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

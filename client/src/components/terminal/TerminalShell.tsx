import { BootOverlay } from "./BootOverlay";
import { Clock } from "./Clock";
import { PaneTabs } from "./PaneTabs";
import { ScanlineOverlay } from "./ScanlineOverlay";

/** App chrome: header (logo · pane tabs · status), main, footer status line. */
export function TerminalShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BootOverlay />
      <ScanlineOverlay />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex h-11 shrink-0 items-stretch justify-between border-b border-line bg-bg-raised/70 pl-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold tracking-[0.2em] text-cyan">
              HOSHI
            </span>
          </div>

          <PaneTabs />

          <div className="flex items-center gap-4 pr-4 text-xs">
            <span className="flex items-center gap-1.5 text-fg-dim">
              <span className="size-1.5 rounded-full bg-gain hoshi-pulse" />
              DEMO TIER
            </span>
            <Clock />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-line bg-bg-sunken px-4 text-[11px] tracking-wider text-fg-faint">
          <span>HOSHI v0.1 · LOCAL</span>
          <span>COINGECKO · DEMO · ~90 REQ/MIN</span>
        </footer>
      </div>
    </>
  );
}

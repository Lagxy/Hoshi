"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "SCREENER" },
  { href: "/history", label: "HISTORY" },
] as const;

/** Terminal-style pane tabs. Real routes, presented as one running terminal. */
export function PaneTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-stretch self-stretch text-xs font-display tracking-[0.18em]">
      {TABS.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center border-b-2 px-4 transition-colors ${
              active
                ? "border-cyan text-cyan"
                : "border-transparent text-fg-dim hover:text-fg"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

import type { Metadata } from "next";
import { Martian_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TerminalShell } from "@/components/terminal/TerminalShell";

// Display chrome (logo, section titles) — geometric, technical.
const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

// Data / tables / body — superb tabular figures at dense sizes.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "HOSHI",
  description:
    "Personal crypto token screener — a multi-criteria funnel over CoinGecko market data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${martianMono.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <TerminalShell>{children}</TerminalShell>
      </body>
    </html>
  );
}

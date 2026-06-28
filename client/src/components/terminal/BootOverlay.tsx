"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LINES = [
  "HOSHI · cold boot",
  "› init runtime ................ ok",
  "› connect coingecko .......... demo tier",
  "› cache window ............... 15m markets / 7d detail",
  "› rate limiter ............... ~90 req/min",
  "› system ready",
];

/**
 * One-time terminal boot overlay. Plays once per browser session (sessionStorage)
 * so it never replays on soft navigations. The app renders underneath the whole
 * time — this only sits on top and fades out.
 */
export function BootOverlay() {
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState(0);

  // Decide whether to play (deferred off the effect body to satisfy lint rules).
  useEffect(() => {
    if (sessionStorage.getItem("hoshi_booted") === "1") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("hoshi_booted", "1");
      return;
    }
    sessionStorage.setItem("hoshi_booted", "1");
    let active = true;
    Promise.resolve().then(() => {
      if (active) setShow(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Reveal lines, then dismiss.
  useEffect(() => {
    if (!show) return;
    if (shown >= LINES.length) {
      const t = setTimeout(() => setShow(false), 480);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 160 : 200);
    return () => clearTimeout(t);
  }, [show, shown]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="boot"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-bg"
        >
          <div className="w-full max-w-md px-6 font-mono text-xs leading-relaxed">
            {LINES.slice(0, shown).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16 }}
                className={i === LINES.length - 1 ? "text-cyan" : "text-fg-dim"}
              >
                {line}
              </motion.div>
            ))}
            {shown < LINES.length && <span className="hoshi-cursor" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

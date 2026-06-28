"use client";

import { useEffect, useState } from "react";

/** Live UTC clock for the header status strip. */
export function Clock() {
  const [now, setNow] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums text-fg-dim">{now} UTC</span>;
}

/** Static CRT scanlines + vignette + a slow cyan beam. Purely decorative. */
export function ScanlineOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.16) 3px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 0%, transparent 52%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 h-28 opacity-[0.05] motion-reduce:hidden"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--cyan), transparent)",
          animation: "hoshi-beam 7.5s linear infinite",
        }}
      />
    </div>
  );
}

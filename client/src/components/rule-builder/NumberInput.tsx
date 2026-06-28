"use client";

import { useState } from "react";

/** "1234567" -> "1.234.567" (dot grouping; integer fields only). */
function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Display a numeric value: grouped integer, or plain for decimal fields. */
function formatValue(value: number | null, grouping: boolean): string {
  if (value == null || Number.isNaN(value)) return "";
  if (!grouping) return String(value);
  const neg = value < 0;
  const intPart = Math.abs(Math.trunc(value)).toString();
  return (neg ? "-" : "") + group(intPart);
}

/** Strip leading zeros while keeping a single 0 before a decimal point. */
function fixZeros(s: string): string {
  const str = s.startsWith(".") ? `0${s}` : s;
  const dot = str.indexOf(".");
  let int = dot === -1 ? str : str.slice(0, dot);
  const frac = dot === -1 ? "" : str.slice(dot);
  const neg = int.startsWith("-");
  if (neg) int = int.slice(1);
  int = int.replace(/^0+(?=\d)/, "");
  if (int === "") int = "0";
  return (neg ? "-" : "") + int + frac;
}

/** Allow only digits, one optional dot (if decimals), one leading minus (if allowed). */
function sanitize(raw: string, decimals: boolean, allowNegative: boolean): string {
  const neg = allowNegative && raw.trim().startsWith("-");
  let s = raw.replace(/[^\d.]/g, "");
  if (!decimals) {
    s = s.replace(/\./g, "");
  } else {
    const first = s.indexOf(".");
    if (first !== -1) {
      s = s.slice(0, first + 1) + s.slice(first + 1).replace(/\./g, "");
    }
  }
  if (s === "") return neg ? "-" : "";
  return fixZeros((neg ? "-" : "") + s);
}

function parse(s: string): number | null {
  if (s === "" || s === "-" || s === "." || s === "-.") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function NumberInput({
  value,
  onChange,
  grouping = false,
  decimals = false,
  allowNegative = false,
  placeholder,
  ariaLabel,
  disabled,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  grouping?: boolean;
  decimals?: boolean;
  allowNegative?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  // While focused show the raw editing buffer; otherwise the formatted value.
  const display = focused ? draft : formatValue(value, grouping);

  return (
    <input
      type="text"
      inputMode={decimals ? "decimal" : "numeric"}
      aria-label={ariaLabel}
      disabled={disabled}
      value={display}
      placeholder={placeholder}
      onFocus={() => {
        setDraft(value == null ? "" : String(value));
        setFocused(true);
      }}
      onChange={(e) => {
        const s = sanitize(e.target.value, decimals, allowNegative);
        setDraft(s);
        onChange(parse(s));
      }}
      onBlur={() => setFocused(false)}
      className={className}
    />
  );
}

"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * CopyLine
 * Reusable row with label + value + copy button
 *
 * displayValue -> what the user sees
 * copyValue -> what goes to clipboard (important for passwords)
 */

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // fallback (older browsers)
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export default function CopyLine({
  label,
  displayValue,
  copyValue,
  mask = false,
}: {
  label: string;
  displayValue: string;
  copyValue?: string;
  mask?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const shownValue = mask
    ? "*".repeat(displayValue?.length || 0)
    : displayValue || "—";

  async function onCopy() {
    const text = `${label}: ${copyValue ?? displayValue ?? ""}`;
    if (!text.trim()) return;

    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="min-w-0">
        <div className="text-[11px] text-app-text">{label}</div>
        <div className="text-sm font-medium text-app-headerText break-all">
          {shownValue}
        </div>
      </div>

      <button
        type="button"
        onClick={onCopy}
        disabled={!displayValue}
        className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs hover:bg-gray-50 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Copy"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

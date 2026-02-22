"use client";

import { useState } from "react";

export default function InfoDropdown({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className="text-gray-500 text-sm">{open ? "−" : "+"}</div>
      </button>

      {open ? (
        <div className="px-4 pb-4 text-sm text-gray-700 leading-relaxed">
          {children}
        </div>
      ) : null}
    </div>
  );
}

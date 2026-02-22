"use client";

import { useMemo, useState } from "react";

export default function BadgeList({
  label,
  items,
  max = 12,
  emptyText = "—",
}: {
  label: string;
  items: string[];
  max?: number;
  emptyText?: string;
}) {
  const safeItems = useMemo(
    () =>
      Array.isArray(items)
        ? items.filter((x) => typeof x === "string" && x.trim())
        : [],
    [items],
  );

  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? safeItems : safeItems.slice(0, max);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold text-gray-900 text-center">
        {label}
      </div>

      {safeItems.length === 0 ? (
        <div className="text-sm text-gray-500 mt-3 text-center">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {shown.map((x, idx) => (
              <span
                key={`${x}-${idx}`}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-700"
              >
                {x}
              </span>
            ))}
          </div>

          {safeItems.length > max ? (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="text-xs rounded-xl border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50"
              >
                {showAll
                  ? "Show less"
                  : `Show more (${safeItems.length - max})`}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

export type SimilarImageItem = {
  url: string;
  similarity?: number | null; // 0..1
  citation?: string | null; // owner/provider
  license_name?: string | null;
  license_url?: string | null;
};

function pct01(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const clamped = Math.max(0, Math.min(1, v));
  return Math.round(clamped * 100);
}

export default function SimilarImagesCarousel({
  items,
  title = "Similar cases (same suspected disease)",
}: {
  items: SimilarImageItem[];
  title?: string;
}) {
  const safeItems = useMemo(
    () => (Array.isArray(items) ? items.filter((x) => x?.url) : []),
    [items],
  );

  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setI((x) => Math.max(0, Math.min(x, safeItems.length - 1)));
  }, [safeItems.length]);

  if (safeItems.length === 0) return null;

  const active = safeItems[i];
  const similarityPct = pct01(active.similarity);

  function prev() {
    setI((x) => (x - 1 + safeItems.length) % safeItems.length);
  }
  function next() {
    setI((x) => (x + 1) % safeItems.length);
  }

  return (
    <>
      <div className="mt-3">
        <div className="text-sm font-semibold text-gray-900">{title}</div>

        {/* wrapper must be relative so overlay buttons position correctly */}
        <div className="relative mt-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {/* image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt=""
            className="w-full h-[220px] object-cover cursor-zoom-in"
            loading="lazy"
            onClick={() => setOpen(true)}
          />

          {/* neat minimal Prev/Next buttons */}
          {safeItems.length > 1 ? (
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="rounded-xl bg-white/90 border border-gray-200 px-3 py-1.5 text-xs hover:bg-white active:scale-[0.98] transition"
                aria-label="Previous similar image"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-white/90 border border-gray-200 px-3 py-1.5 text-xs hover:bg-white active:scale-[0.98] transition"
                aria-label="Next similar image"
              >
                Next
              </button>
            </div>
          ) : null}

          {/* meta */}
          <div className="p-3 border-t border-gray-100 text-xs text-gray-700 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-gray-900">Details</div>
              <div className="rounded-full bg-black/60 text-white px-3 py-1">
                {i + 1}/{safeItems.length}
              </div>
            </div>

            {similarityPct != null ? (
              <div>
                Similarity:{" "}
                <span className="font-semibold">{similarityPct}%</span>
              </div>
            ) : (
              <div>Similarity: —</div>
            )}

            <div className="truncate">
              Owner / Citation:{" "}
              <span className="font-semibold">
                {active.citation?.trim() || "—"}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="truncate">
                License:{" "}
                <span className="font-semibold">
                  {active.license_name?.trim() || "—"}
                </span>
              </span>

              {active.license_url ? (
                <a
                  href={active.license_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              ) : null}
            </div>
          </div>

          {/* dots */}
          {safeItems.length > 1 ? (
            <div className="px-3 pb-3 flex items-center justify-center gap-2">
              {safeItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setI(idx)}
                  className={`h-2 w-2 rounded-full border ${
                    idx === i
                      ? "bg-gray-900 border-gray-900"
                      : "bg-gray-200 border-gray-300"
                  }`}
                  aria-label={`Go to similar image ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* fullscreen */}
      {open ? (
        <div
          className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-0 -top-12 flex items-center gap-2">
              <div className="rounded-xl bg-white text-sm px-4 py-2 border border-gray-200">
                Similarity:{" "}
                <span className="font-semibold">
                  {similarityPct != null ? `${similarityPct}%` : "—"}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                {active.citation?.trim() || "—"}
                <span className="mx-2 text-gray-300">•</span>
                {i + 1}/{safeItems.length}
              </div>

              <button
                type="button"
                className="rounded-xl bg-white text-sm px-4 py-2 border border-gray-200 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt=""
                className="w-full max-h-[80vh] object-contain bg-black"
              />

              {/* fullscreen minimal prev/next */}
              {safeItems.length > 1 ? (
                <div className="absolute inset-x-0 bottom-4 px-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prev}
                    className="rounded-xl bg-white/90 border border-gray-200 px-4 py-2 text-sm hover:bg-white active:scale-[0.98] transition"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-xl bg-white/90 border border-gray-200 px-4 py-2 text-sm hover:bg-white active:scale-[0.98] transition"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

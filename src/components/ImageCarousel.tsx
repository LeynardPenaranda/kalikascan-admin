"use client";

import { useEffect, useMemo, useState } from "react";

export default function ImageCarousel({ images }: { images: string[] }) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [i, setI] = useState(0);

  // fullscreen viewer
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // clamp when images changes
    setI((x) => Math.max(0, Math.min(x, safeImages.length - 1)));
  }, [safeImages.length]);

  if (safeImages.length === 0) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No images.
      </div>
    );
  }

  function prev() {
    setI((x) => (x - 1 + safeImages.length) % safeImages.length);
  }
  function next() {
    setI((x) => (x + 1) % safeImages.length);
  }

  const active = safeImages[i];

  return (
    <>
      <div className="w-full">
        <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active}
            alt=""
            className="w-full h-[260px] object-cover cursor-zoom-in"
            onClick={() => setOpen(true)}
          />

          {/* arrows */}
          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-gray-200 px-3 py-2 text-xs hover:bg-white"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-gray-200 px-3 py-2 text-xs hover:bg-white"
                aria-label="Next image"
              >
                →
              </button>
            </>
          ) : null}

          {/* counter */}
          <div className="absolute right-3 bottom-3 rounded-full bg-black/60 text-white text-xs px-3 py-1">
            {i + 1}/{safeImages.length}
          </div>
        </div>

        {/* dots */}
        {safeImages.length > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                className={`h-2 w-2 rounded-full border ${
                  idx === i
                    ? "bg-gray-900 border-gray-900"
                    : "bg-gray-200 border-gray-300"
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* fullscreen modal */}
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
              <button
                type="button"
                className="rounded-xl bg-white text-sm px-4 py-2 border border-gray-200 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Close ({i + 1}/{safeImages.length})
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active}
                alt=""
                className="w-full max-h-[80vh] object-contain bg-black"
              />

              {safeImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-gray-200 px-3 py-2 text-xs hover:bg-white"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-gray-200 px-3 py-2 text-xs hover:bg-white"
                  >
                    →
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type LogoItem = {
  src: string;
  alt?: string;
};

export default function LogoSlider({
  logos,
  intervalMs = 2200,
  size = 40,
  className = "",
}: {
  logos: LogoItem[];
  intervalMs?: number;
  size?: number; // px (square)
  className?: string;
}) {
  const safeLogos = useMemo(() => logos?.filter(Boolean) ?? [], [logos]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeLogos.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeLogos.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [safeLogos.length, intervalMs]);

  if (safeLogos.length === 0) return null;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl",
        "ring-1 ring-black/10 bg-white",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      aria-label="Logo slider"
    >
      {safeLogos.map((logo, i) => {
        const active = i === index;

        // "slide" direction based on relative position
        const offset =
          i === index
            ? "translate-x-0"
            : i > index
              ? "translate-x-full"
              : "-translate-x-full";

        return (
          <div
            key={`${logo.src}-${i}`}
            className={[
              "absolute inset-0",
              "transition-all duration-500 ease-out",
              active ? "opacity-100" : "opacity-0",
              active ? "translate-x-0" : offset,
            ].join(" ")}
          >
            <Image
              src={logo.src}
              alt={logo.alt ?? "KalikaScan Logo"}
              fill
              className="object-contain p-1"
              priority={active}
            />
          </div>
        );
      })}
    </div>
  );
}

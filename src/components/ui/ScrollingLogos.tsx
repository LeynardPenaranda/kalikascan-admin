"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";

type LogoItem = {
  src: string;
  alt: string;
};

function ScrollingLogosComponent({
  logos,
  heightClass = "h-[90px]",
  itemClass = "w-16 sm:w-20 md:w-24",
  gapClass = "gap-6 sm:gap-8 md:gap-10",
  duration = 35, // smaller = faster
  fadeEdges = true,
}: {
  logos: LogoItem[];
  heightClass?: string;
  itemClass?: string;
  gapClass?: string;
  duration?: number;
  fadeEdges?: boolean;
}) {
  const safeLogos = useMemo(() => logos.filter(Boolean), [logos]);

  const render = safeLogos.map((logo) => (
    <div
      key={logo.src}
      className={[
        "relative shrink-0",
        itemClass,
        // keep square and responsive
        "aspect-square",
      ].join(" ")}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        fill
        quality={100}
        className="object-contain"
        priority={false}
      />
    </div>
  ));

  if (!safeLogos.length) return null;

  return (
    <div className={["relative w-full overflow-hidden", heightClass].join(" ")}>
      {/* optional edge fade so it looks clean */}
      {fadeEdges && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 sm:w-16 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:w-16 bg-gradient-to-l from-white to-transparent z-10" />
        </>
      )}

      <div className={["flex items-center h-full", gapClass].join(" ")}>
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className={["flex items-center shrink-0", gapClass].join(" ")}
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {render}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const ScrollingLogos = memo(ScrollingLogosComponent);
export default ScrollingLogos;

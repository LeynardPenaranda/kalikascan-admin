"use client";

import { BadgeCheck, Sprout } from "lucide-react";

type Props = {
  role: "expert" | "regular";
  /** default: "sm" */
  size?: "xs" | "sm" | "md";
  /** show text label beside icon (optional) */
  showLabel?: boolean;
  /** override absolute positioning (useful if not placed on avatar) */
  className?: string;
};

export default function UserBadge({
  role,
  size = "sm",
  showLabel = false,
  className = "",
}: Props) {
  const isExpert = role === "expert";

  const sizeCls =
    size === "xs"
      ? "text-[9px] px-1.5 py-0.5 gap-1"
      : size === "md"
        ? "text-[11px] px-2.5 py-1 gap-1.5"
        : "text-[10px] px-2 py-0.5 gap-1"; // sm

  const iconSize = size === "xs" ? 12 : size === "md" ? 16 : 14;

  return (
    <span
      className={[
        // by default behave like an "avatar corner badge"
        "absolute -top-1 -left-1 inline-flex items-center rounded-full border bg-white",
        sizeCls,
        isExpert
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
        className,
      ].join(" ")}
    >
      {isExpert ? (
        <BadgeCheck size={iconSize} className="shrink-0" />
      ) : (
        <Sprout size={iconSize} className="shrink-0" />
      )}

      {showLabel ? <span>{isExpert ? "Expert" : "Adventurer"}</span> : null}
    </span>
  );
}

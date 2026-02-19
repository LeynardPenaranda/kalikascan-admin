"use client";

import { DEFAULT_ADMIN_AVATAR } from "@/src/constant";
import { useState } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

function getInitials(name?: string | null, email?: string | null) {
  const base = (name || email || "").trim();
  if (!base) return "U";

  if (base.includes("@")) {
    return base[0].toUpperCase();
  }

  const parts = base.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type Props = {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
  ring?: boolean; // green ring (active/admin)
  onClick?: () => void;
};

export default function Avatar({
  src,
  name,
  email,
  size = "md",
  className = "",
  ring = false,
  onClick,
}: Props) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;
  const initials = getInitials(name, email);

  return (
    <div
      onClick={onClick}
      className={[
        "relative rounded-full overflow-hidden select-none flex items-center justify-center bg-gray-100 text-gray-600 font-semibold shrink-0",
        SIZE_MAP[size],
        ring ? "ring-2 ring-green-500 ring-offset-2" : "",
        onClick ? "cursor-pointer hover:opacity-90 transition" : "",
        className,
      ].join(" ")}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? DEFAULT_ADMIN_AVATAR}
          alt="avatar"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

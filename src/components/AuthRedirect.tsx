"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/app/providers";

export default function AuthRedirect() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If logged in as admin, never stay on public pages
    if (user && isAdmin && pathname === "/") {
      router.replace("/admin");
    }
  }, [user, isAdmin, loading, pathname, router]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";
import AdminLoginCard from "@/src/components/AdminLoginCard";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <AdminLoginCard onSuccess={() => router.replace("/admin")} />
    </div>
  );
}

// src/components/AdminSidebar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/src/lib/firebase/client";
import {
  LayoutDashboard,
  Leaf,
  MapPinned,
  Stethoscope,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Plant Scans", href: "/admin/plant-scans", icon: Leaf },
  { label: "Map Scans", href: "/admin/map-scans", icon: MapPinned },
  { label: "Health Assessments", href: "/admin/health", icon: Stethoscope },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function onLogout() {
    await auth.signOut();
    window.location.href = "/"; // go back to login/home
  }

  return (
    <aside className="sticky top-0 h-screen w-72 shrink-0 border-r border-black/10 bg-white">
      <div className="h-full flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="KalikaScan"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-app-headerText">
                KalikaScan
              </div>
              <div className="text-xs text-app-text">Admin Dashboard</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 flex-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-black/40 px-3 mb-2">
            MENU
          </div>

          <ul className="space-y-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));

              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                      active
                        ? "bg-app-primarySoft text-app-headerText"
                        : "text-app-text hover:bg-black/5",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {active ? (
                      <span className="ml-auto h-2 w-2 rounded-full bg-app-button" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-black/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-app-text hover:bg-black/5 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>

          <div className="px-3 pt-3 text-[11px] text-black/35">
            © {new Date().getFullYear()} KalikaScan
          </div>
        </div>
      </div>
    </aside>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import AdminGuard from "@/src/components/AdminGuard";
import AdminSidebar from "@/src/components/AdminSidebar";
import { Drawer, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Decide what you consider "desktop"
  // If you want Drawer for mobile+tablet, then show fixed sidebar only on lg+
  // Tailwind: lg = 1024px
  const drawerWidth = useMemo(() => 280, []);

  return (
    <AdminGuard>
      {/* Optional: container for container-query variants if you use them */}
      <div className="h-screen bg-app-bg @container">
        <div className="flex h-full">
          {/*  Desktop Sidebar (visible on lg+) */}
          <div className="hidden lg:block">
            <AdminSidebar />
          </div>

          {/*  Mobile/Tablet Drawer Sidebar (shown below lg) */}
          <Drawer
            title="KalikaScan Admin"
            placement="left"
            open={open}
            onClose={() => setOpen(false)}
            size="default" // or "large"
            destroyOnHidden
            styles={{
              body: {
                padding: 0,
              },
            }}
          >
            <div className="h-full">
              <AdminSidebar />
            </div>
          </Drawer>

          {/* Main area */}
          <div className="flex-1 h-full flex flex-col min-w-0">
            {/*  Topbar only on mobile/tablet */}
            <header className="sticky top-0 z-20 flex items-center gap-3 bg-app-bg/90 backdrop-blur px-3 py-3 border-b lg:hidden">
              <Button
                type="primary"
                style={{
                  backgroundColor: "#16a34a",
                  borderColor: "#16a34a",
                }}
                icon={<MenuOutlined />}
                onClick={() => setOpen(true)}
              />
              <div className="font-semibold">KalikaScan Admin</div>
            </header>

            <main className="flex-1 h-full overflow-y-auto min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

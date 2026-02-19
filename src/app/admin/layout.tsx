import AdminGuard from "@/src/components/AdminGuard";
import AdminSidebar from "@/src/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="h-screen bg-app-bg">
        <div className="flex h-full">
          <AdminSidebar />
          <main className="flex-1 h-full overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}

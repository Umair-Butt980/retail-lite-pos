import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar title="AutoParts POS" />
        <main className="flex-1 p-4 lg:p-6 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}

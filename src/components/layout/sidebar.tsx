"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/pos", label: "Point of sale", icon: ShoppingCart, adminOnly: false },
  { href: "/bills", label: "Bills", icon: FileText, adminOnly: false },
  { href: "/external-work", label: "External work", icon: Wrench, adminOnly: false },
  { href: "/inventory", label: "Inventory", icon: Package, adminOnly: true },
  { href: "/suppliers", label: "Suppliers", icon: Users, adminOnly: true },
  { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      className="hidden md:flex w-60 flex-col border-r bg-sidebar h-screen sticky top-0"
      aria-label="main navigation sidebar"
    >
      <div className="flex h-14 items-center border-b px-4 gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <ShoppingBag className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm">AutoParts POS</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="sidebar navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`navigate to ${item.label}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground capitalize">
          Role: {session?.user?.role ?? "—"}
        </p>
      </div>
    </aside>
  );
}

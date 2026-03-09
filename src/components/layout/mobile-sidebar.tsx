"use client";

import { useState } from "react";
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
  Menu,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/pos", label: "Point of sale", icon: ShoppingCart, adminOnly: false },
  { href: "/bills", label: "Bills", icon: FileText, adminOnly: false },
  { href: "/inventory", label: "Inventory", icon: Package, adminOnly: true },
  { href: "/suppliers", label: "Suppliers", icon: Users, adminOnly: true },
  { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: true },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="open mobile menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="close mobile menu overlay"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r flex flex-col">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <ShoppingBag className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">AutoParts POS</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="close mobile menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1" aria-label="mobile navigation">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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
          </aside>
        </div>
      )}
    </>
  );
}

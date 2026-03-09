"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileSidebar from "./mobile-sidebar";

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header
      className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6"
      aria-label="top navigation bar"
    >
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            aria-label="user menu button"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="hidden sm:block text-sm">{session?.user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{session?.user?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="sign out button"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

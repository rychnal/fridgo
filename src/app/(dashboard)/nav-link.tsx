"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: LucideIcon;
  mobile?: boolean;
}

export function NavLink({ href, children, icon: Icon, mobile = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  if (mobile) {
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-10 h-6 rounded-full transition-colors",
          isActive && "bg-accent"
        )}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
        </div>
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
      {children}
    </Link>
  );
}

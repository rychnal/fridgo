"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Refrigerator, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translations } from "@/lib/i18n/translations";

type NavT = Translations["nav"];

function useNavItems(t: NavT) {
  return [
    { href: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { href: "/pantry",    label: t.pantry,    icon: Refrigerator },
    { href: "/recipes",   label: t.recipes,   icon: UtensilsCrossed },
    { href: "/shopping",  label: t.shopping,  icon: ShoppingCart },
  ];
}

export function DesktopNav({ t }: { t: NavT }) {
  const pathname = usePathname();
  const navItems = useNavItems(t);

  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ t }: { t: NavT }) {
  const pathname = usePathname();
  const navItems = useNavItems(t);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border z-20 safe-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
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
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

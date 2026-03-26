import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UtensilsCrossed, ShoppingCart, Refrigerator, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";

export const metadata: Metadata = {
  title: "Přehled",
};

const navItems = [
  { href: "/dashboard", label: "Přehled", icon: LayoutDashboard },
  { href: "/pantry",    label: "Zásoby",   icon: Refrigerator },
  { href: "/recipes",   label: "Recepty",  icon: UtensilsCrossed },
  { href: "/shopping",  label: "Nákupy",   icon: ShoppingCart },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-20 h-14">
        <div className="max-w-3xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-sm font-black">F</span>
            fridgo
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <UserMenu email={user.email ?? ""} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border z-20 safe-bottom">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} mobile>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

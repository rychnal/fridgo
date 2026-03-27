import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getT } from "@/lib/i18n";
import { DesktopNav, MobileNav } from "./app-nav";
import { UserMenu } from "./user-menu";

export const metadata: Metadata = { title: "Přehled" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const t = getT(locale);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="bg-white border-b border-border sticky top-0 z-20 h-14">
        <div className="max-w-3xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-sm font-black">F</span>
            fridgo
          </Link>
          <DesktopNav t={t.nav} />
          <UserMenu email={user.email ?? ""} locale={locale} t={t.userMenu} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>

      <MobileNav t={t.nav} />
    </div>
  );
}

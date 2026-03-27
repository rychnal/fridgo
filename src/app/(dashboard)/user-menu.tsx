"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setLocale } from "@/actions/locale.actions";
import type { Locale, Translations } from "@/lib/i18n/translations";

interface UserMenuProps {
  email: string;
  locale: Locale;
  t: Translations["userMenu"];
}

export function UserMenu({ email, locale, t }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleLocale(l: Locale) {
    if (l === locale) return;
    setOpen(false);
    startTransition(async () => {
      await setLocale(l);
      window.location.reload();
    });
  }

  const initials = email.charAt(0).toUpperCase();

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      )}
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-border z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-muted-foreground">{t.loggedInAs}</p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">{email}</p>
            </div>

            {/* Language switcher */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-muted-foreground mb-2">{t.language}</p>
              <div className="flex gap-1.5">
                {(["cs", "en"] as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLocale(l)}
                    disabled={isPending}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      locale === l
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground hover:bg-accent hover:text-primary"
                    }`}
                  >
                    {l === "cs" ? "🇨🇿 CZ" : "🇬🇧 EN"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut size={15} />
              {loading ? t.signingOut : t.signOut}
            </button>
          </div>
        </>
      )}
    </div>
    </>
  );
}

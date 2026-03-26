import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Package, ChefHat, Camera, Plus, Sparkles, Refrigerator, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LOCATION_LABELS, type Location } from "@/types";

export const metadata: Metadata = { title: "Přehled" };

const locationConfig: Record<Location, { icon: string; bg: string; text: string; border: string }> = {
  fridge:  { icon: "🧊", bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-100" },
  pantry:  { icon: "🥫", bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-100" },
  freezer: { icon: "❄️", bg: "bg-cyan-50",   text: "text-cyan-700",  border: "border-cyan-100" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: items } = await supabase
    .from("pantry_items")
    .select("location, expires_at")
    .eq("user_id", user.id);

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const stats = (["fridge", "pantry", "freezer"] as Location[]).map((location) => {
    const loc = (items ?? []).filter((i) => i.location === location);
    const expiring = loc.filter((i) => {
      if (!i.expires_at) return false;
      const d = new Date(i.expires_at);
      return d <= inThreeDays && d >= now;
    }).length;
    return { location, count: loc.length, expiring };
  });

  const totalItems = (items ?? []).length;
  const totalExpiring = stats.reduce((s, i) => s + i.expiring, 0);
  const { count: recipeCount } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="space-y-6">

      {/* Expiry alert */}
      {totalExpiring > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-800 text-sm">
              {totalExpiring} {totalExpiring === 1 ? "položka brzy vyprší" : totalExpiring < 5 ? "položky brzy vyprší" : "položek brzy vyprší"}
            </p>
            <Link href="/pantry" className="text-xs text-amber-700 underline underline-offset-2 mt-0.5 inline-block">
              Zkontrolovat zásoby
            </Link>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package size={15} />
            <span className="text-xs font-medium">Celkem ingrediencí</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalItems}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ChefHat size={15} />
            <span className="text-xs font-medium">Uložené recepty</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{recipeCount ?? 0}</p>
        </div>
      </div>

      {/* Location cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Zásoby</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const cfg = locationConfig[s.location];
            return (
              <Link
                key={s.location}
                href={`/pantry?tab=${s.location}`}
                className={`relative rounded-xl border p-4 transition hover:shadow-sm active:scale-[0.98] ${cfg.bg} ${cfg.border}`}
              >
                {s.expiring > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
                    {s.expiring}
                  </span>
                )}
                <span className="text-2xl block mb-2">{cfg.icon}</span>
                <p className={`text-xs font-semibold ${cfg.text}`}>{LOCATION_LABELS[s.location]}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{s.count}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rychlé akce</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/recipes?action=generate"
            className="flex items-center gap-4 bg-primary text-white rounded-xl p-4 hover:bg-primary/90 transition active:scale-[0.99]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Vygenerovat recept</p>
              <p className="text-xs text-white/70">AI navrhne recept ze zásobů</p>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/pantry?action=scan"
              className="flex items-center gap-3 bg-white border border-border rounded-xl p-3.5 hover:border-primary/30 hover:bg-accent transition active:scale-[0.98]"
            >
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Camera size={17} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Skenovat</p>
                <p className="text-xs text-muted-foreground">Vyfotit zásoby</p>
              </div>
            </Link>

            <Link
              href="/pantry?action=add"
              className="flex items-center gap-3 bg-white border border-border rounded-xl p-3.5 hover:border-primary/30 hover:bg-accent transition active:scale-[0.98]"
            >
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <Plus size={17} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Přidat</p>
                <p className="text-xs text-muted-foreground">Zadat ručně</p>
              </div>
            </Link>
          </div>

          <Link
            href="/shopping"
            className="flex items-center gap-4 bg-white border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-accent transition active:scale-[0.99]"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Nákupní seznam</p>
              <p className="text-xs text-muted-foreground">Chybějící ingredience</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import { PantryClient } from "./pantry-client";
import type { Location, PantryItem } from "@/types";

export const metadata: Metadata = { title: "Zásoby" };

export default async function PantryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; action?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const activeTab = (params.tab as Location) || "fridge";

  const { data: items } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: Record<string, any>[] | null };

  const pantryItems: PantryItem[] = (items ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    location: row.location as Location,
    isFrozen: row.is_frozen,
    source: row.source as PantryItem["source"],
    scanImageUrl: row.scan_image_url,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));

  return (
    <PantryClient
      initialItems={pantryItems}
      initialTab={activeTab}
      initialAction={params.action}
      locale={locale}
    />
  );
}

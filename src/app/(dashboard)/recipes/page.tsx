import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getT } from "@/lib/i18n";
import { RecipesClient } from "./recipes-client";
import type { Location, PantryItem, Recipe } from "@/types";

export const metadata: Metadata = { title: "Recepty" };

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const t = getT(locale);

  const [{ data: pantryData }, { data: recipesData }] = await Promise.all([
    supabase.from("pantry_items").select("*").eq("user_id", user.id).order("name"),
    supabase.from("recipes").select("*, recipe_ingredients(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]) as [{ data: Record<string, any>[] | null }, { data: Record<string, any>[] | null }];

  const pantryItems: PantryItem[] = (pantryData ?? []).map((row) => ({
    id: row.id, userId: row.user_id, name: row.name, quantity: row.quantity,
    unit: row.unit, location: row.location as Location, isFrozen: row.is_frozen,
    source: row.source as PantryItem["source"], scanImageUrl: row.scan_image_url,
    expiresAt: row.expires_at, createdAt: row.created_at,
  }));

  const recipes: Recipe[] = (recipesData ?? []).map((r) => ({
    id: r.id, userId: r.user_id, title: r.title, description: r.description,
    instructions: r.instructions, prepTimeMinutes: r.prep_time_minutes,
    cookTimeMinutes: r.cook_time_minutes, servings: r.servings,
    aiGenerated: r.ai_generated, createdAt: r.created_at,
    ingredients: (r.recipe_ingredients ?? []).map((ing: Record<string, any>) => ({
      id: ing.id, recipeId: ing.recipe_id, name: ing.name,
      quantity: ing.quantity, unit: ing.unit, availableInPantry: ing.available_in_pantry,
    })),
  }));

  return (
    <RecipesClient
      pantryItems={pantryItems}
      initialRecipes={recipes}
      initialAction={params.action}
      locale={locale}
      locationLabels={{ fridge: t.pantry.fridge, pantry: t.pantry.pantryLabel, freezer: t.pantry.freezer }}
    />
  );
}

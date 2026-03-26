"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  Location,
  PantryItem,
  CreatePantryItemInput,
} from "@/types";

function mapRow(row: {
  id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  location: string;
  is_frozen: boolean;
  source: string;
  scan_image_url: string | null;
  expires_at: string | null;
  created_at: string;
}): PantryItem {
  return {
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
  };
}

export async function getPantryItems(
  location?: Location
): Promise<ActionResult<PantryItem[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    let query = supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (location) {
      query = query.eq("location", location);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: `Nepodařilo se načíst položky: ${error.message}` };
    }

    return { success: true, data: (data ?? []).map(mapRow) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function addPantryItem(
  input: CreatePantryItemInput
): Promise<ActionResult<PantryItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    const { data, error } = await supabase
      .from("pantry_items")
      .insert({
        user_id: user.id,
        name: input.name,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        location: input.location,
        is_frozen: input.isFrozen ?? false,
        source: input.source ?? "manual",
        scan_image_url: input.scanImageUrl ?? null,
        expires_at: input.expiresAt ?? null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Nepodařilo se přidat položku: ${error.message}` };
    }

    revalidatePath("/pantry");
    revalidatePath("/dashboard");

    return { success: true, data: mapRow(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function updatePantryItem(
  id: string,
  updates: Partial<CreatePantryItemInput>
): Promise<ActionResult<PantryItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    const updatePayload: Record<string, unknown> = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.quantity !== undefined) updatePayload.quantity = updates.quantity;
    if (updates.unit !== undefined) updatePayload.unit = updates.unit;
    if (updates.location !== undefined) updatePayload.location = updates.location;
    if (updates.isFrozen !== undefined) updatePayload.is_frozen = updates.isFrozen;
    if (updates.source !== undefined) updatePayload.source = updates.source;
    if (updates.scanImageUrl !== undefined) updatePayload.scan_image_url = updates.scanImageUrl;
    if (updates.expiresAt !== undefined) updatePayload.expires_at = updates.expiresAt;

    const { data, error } = await supabase
      .from("pantry_items")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Nepodařilo se aktualizovat položku: ${error.message}` };
    }

    revalidatePath("/pantry");
    revalidatePath("/dashboard");

    return { success: true, data: mapRow(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function deletePantryItem(
  id: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    const { error } = await supabase
      .from("pantry_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: `Nepodařilo se smazat položku: ${error.message}` };
    }

    revalidatePath("/pantry");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

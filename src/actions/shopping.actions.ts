"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  ShoppingList,
  ShoppingItem,
  CreateShoppingItemInput,
} from "@/types";

function mapListRow(row: {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}): ShoppingList {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function mapItemRow(row: {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
}): ShoppingItem {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    checked: row.checked,
    createdAt: row.created_at,
  };
}

export async function createShoppingList(
  name: string
): Promise<ActionResult<ShoppingList>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    if (!name.trim()) {
      return { success: false, error: "Název seznamu nesmí být prázdný" };
    }

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id, name: name.trim() })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Nepodařilo se vytvořit seznam: ${error.message}` };
    }

    revalidatePath("/shopping");

    return { success: true, data: mapListRow(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function getShoppingLists(): Promise<ActionResult<ShoppingList[]>> {
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
      .from("shopping_lists")
      .select(
        `
        *,
        shopping_items (*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: `Nepodařilo se načíst nákupní seznamy: ${error.message}` };
    }

    const mapped = (data ?? []).map((list) => ({
      ...mapListRow(list),
      items: (list.shopping_items ?? []).map(mapItemRow),
    }));

    return { success: true, data: mapped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function addShoppingItem(
  listId: string,
  item: CreateShoppingItemInput
): Promise<ActionResult<ShoppingItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("id", listId)
      .eq("user_id", user.id)
      .single();

    if (listError || !list) {
      return { success: false, error: "Nákupní seznam nebyl nalezen" };
    }

    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        list_id: listId,
        name: item.name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Nepodařilo se přidat položku: ${error.message}` };
    }

    revalidatePath("/shopping");

    return { success: true, data: mapItemRow(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function toggleShoppingItem(
  itemId: string
): Promise<ActionResult<ShoppingItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    // Fetch current state and verify ownership via join
    const { data: existing, error: fetchError } = await supabase
      .from("shopping_items")
      .select("*, shopping_lists!inner(user_id)")
      .eq("id", itemId)
      .eq("shopping_lists.user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Položka nebyla nalezena" };
    }

    const { data, error } = await supabase
      .from("shopping_items")
      .update({ checked: !existing.checked })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Nepodařilo se aktualizovat položku: ${error.message}` };
    }

    revalidatePath("/shopping");

    return { success: true, data: mapItemRow(data) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function deleteShoppingItem(
  itemId: string
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

    // Verify ownership via join before delete
    const { data: existing, error: fetchError } = await supabase
      .from("shopping_items")
      .select("id, shopping_lists!inner(user_id)")
      .eq("id", itemId)
      .eq("shopping_lists.user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Položka nebyla nalezena" };
    }

    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      return { success: false, error: `Nepodařilo se smazat položku: ${error.message}` };
    }

    revalidatePath("/shopping");

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function createListFromRecipe(
  recipeId: string
): Promise<ActionResult<ShoppingList>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    // Fetch recipe with ingredients
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .single();

    if (recipeError || !recipe) {
      return { success: false, error: "Recept nebyl nalezen" };
    }

    // Filter ingredients not available in pantry
    const missingIngredients = (recipe.recipe_ingredients ?? []).filter(
      (ing: { available_in_pantry: boolean }) => !ing.available_in_pantry
    );

    if (missingIngredients.length === 0) {
      return {
        success: false,
        error: "Všechny ingredience jsou dostupné v zásobách — žádný nákupní seznam není potřeba",
      };
    }

    // Create shopping list
    const listName = `Nákup pro: ${recipe.title}`;
    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id, name: listName })
      .select()
      .single();

    if (listError || !list) {
      return { success: false, error: `Nepodařilo se vytvořit seznam: ${listError?.message}` };
    }

    // Add missing ingredients as shopping items
    const shoppingItemsPayload = missingIngredients.map(
      (ing: { name: string; quantity: string | null; unit: string | null }) => ({
        list_id: list.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      })
    );

    const { error: itemsError } = await supabase
      .from("shopping_items")
      .insert(shoppingItemsPayload);

    if (itemsError) {
      return { success: false, error: `Nepodařilo se přidat položky: ${itemsError.message}` };
    }

    revalidatePath("/shopping");

    return { success: true, data: mapListRow(list) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

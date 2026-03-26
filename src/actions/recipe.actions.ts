"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { openai, OPENAI_RECIPE_MODEL } from "@/lib/openai";
import type {
  ActionResult,
  Recipe,
  CreateRecipeInput,
  GeneratedRecipe,
} from "@/types";

function mapRecipeRow(row: {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  instructions: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  ai_generated: boolean;
  created_at: string;
}): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    instructions: row.instructions,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    aiGenerated: row.ai_generated,
    createdAt: row.created_at,
  };
}

export async function generateRecipe(
  pantryItemIds: string[]
): Promise<ActionResult<GeneratedRecipe>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    if (pantryItemIds.length === 0) {
      return { success: false, error: "Vyberte alespoň jednu ingredienci" };
    }

    const { data: items, error: itemsError } = await supabase
      .from("pantry_items")
      .select("*")
      .in("id", pantryItemIds)
      .eq("user_id", user.id);

    if (itemsError || !items || items.length === 0) {
      return { success: false, error: "Nepodařilo se načíst ingredience" };
    }

    const ingredientList = items
      .map((item) => {
        const qty = item.quantity ? `${item.quantity} ${item.unit ?? ""}`.trim() : "";
        const locationLabel =
          item.location === "fridge"
            ? "lednice"
            : item.location === "pantry"
            ? "spíž"
            : "mrazák";
        const frozenNote = item.is_frozen ? " (zmrazené — potřeba rozmrazit)" : "";
        return `- ${item.name}${qty ? ` (${qty})` : ""} [${locationLabel}${frozenNote}]`;
      })
      .join("\n");

    const prompt = `Jsi kuchařský asistent. Na základě dostupných ingrediencí navrhni jeden konkrétní recept.

Dostupné ingredience:
${ingredientList}

Pokyny:
- Ingredience jsou ze třech míst: lednice, spíž a mrazák.
- Položky z mrazáku je třeba před vařením rozmrazit — zohledni to v pokynech a době přípravy.
- Pokud k receptu potřebuješ i jiné ingredience, které nejsou v seznamu, zahrň je také — ale označ je jako nedostupné.
- Odpověz VÝHRADNĚ ve formátu JSON (žádný markdown, žádný text navíc).

Formát odpovědi:
{
  "title": "Název receptu",
  "description": "Krátký popis receptu (1-2 věty)",
  "instructions": "Krok za krokem postup přípravy...",
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 30,
  "servings": 4,
  "ingredients": [
    {
      "name": "název ingredience",
      "quantity": "množství",
      "unit": "jednotka",
      "availableInPantry": true
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_RECIPE_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "OpenAI nevrátil žádnou odpověď" };
    }

    const generated = JSON.parse(content) as GeneratedRecipe;

    return { success: true, data: generated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: `Generování receptu selhalo: ${message}` };
  }
}

export async function saveRecipe(
  input: CreateRecipeInput
): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description ?? null,
        instructions: input.instructions,
        prep_time_minutes: input.prepTimeMinutes ?? null,
        cook_time_minutes: input.cookTimeMinutes ?? null,
        servings: input.servings ?? null,
        ai_generated: input.aiGenerated ?? true,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      return { success: false, error: `Nepodařilo se uložit recept: ${recipeError?.message}` };
    }

    if (input.ingredients && input.ingredients.length > 0) {
      const ingredientsPayload = input.ingredients.map((ing) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        available_in_pantry: ing.availableInPantry ?? false,
      }));

      const { error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientsPayload);

      if (ingError) {
        return { success: false, error: `Nepodařilo se uložit ingredience: ${ingError.message}` };
      }
    }

    revalidatePath("/recipes");

    return { success: true, data: mapRecipeRow(recipe) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function getRecipes(): Promise<ActionResult<Recipe[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        recipe_ingredients (*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: `Nepodařilo se načíst recepty: ${error.message}` };
    }

    const mapped = (recipes ?? []).map((r) => ({
      ...mapRecipeRow(r),
      ingredients: (r.recipe_ingredients ?? []).map(
        (ing: {
          id: string;
          recipe_id: string;
          name: string;
          quantity: string | null;
          unit: string | null;
          available_in_pantry: boolean;
        }) => ({
          id: ing.id,
          recipeId: ing.recipe_id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          availableInPantry: ing.available_in_pantry,
        })
      ),
    }));

    return { success: true, data: mapped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

export async function deleteRecipe(id: string): Promise<ActionResult<void>> {
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
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: `Nepodařilo se smazat recept: ${error.message}` };
    }

    revalidatePath("/recipes");

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

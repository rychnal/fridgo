"use client";

import { useState, useTransition } from "react";
import { type Location, type PantryItem, type Recipe, type GeneratedRecipe } from "@/types";
import { generateRecipe, saveRecipe, deleteRecipe } from "@/actions/recipe.actions";
import { createListFromRecipe } from "@/actions/shopping.actions";
import { translations, type Locale } from "@/lib/i18n/translations";

interface RecipesClientProps {
  pantryItems: PantryItem[];
  initialRecipes: Recipe[];
  initialAction?: string;
  locale: Locale;
  locationLabels: Record<Location, string>;
}

export function RecipesClient({ pantryItems, initialRecipes, initialAction, locale, locationLabels }: RecipesClientProps) {
  const t = translations[locale].recipes;
  const [recipes, setRecipes] = useState(initialRecipes);
  const [showGenerator, setShowGenerator] = useState(initialAction === "generate");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const locationGroups: Location[] = ["fridge", "pantry", "freezer"];

  function toggleItem(id: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (selectedItemIds.size === 0) { setError(t.selectIngredients); return; }
    setError(null); setGeneratedRecipe(null);
    startTransition(async () => {
      const result = await generateRecipe(Array.from(selectedItemIds));
      if (!result.success) { setError(result.error); return; }
      setGeneratedRecipe(result.data);
    });
  }

  async function handleSaveRecipe() {
    if (!generatedRecipe) return;
    setError(null);
    startTransition(async () => {
      const result = await saveRecipe({
        title: generatedRecipe.title, description: generatedRecipe.description,
        instructions: generatedRecipe.instructions, prepTimeMinutes: generatedRecipe.prepTimeMinutes,
        cookTimeMinutes: generatedRecipe.cookTimeMinutes, servings: generatedRecipe.servings,
        aiGenerated: true,
        ingredients: generatedRecipe.ingredients.map((ing) => ({
          name: ing.name, quantity: ing.quantity, unit: ing.unit, availableInPantry: ing.availableInPantry,
        })),
      });
      if (!result.success) { setError(result.error); return; }
      setRecipes((prev) => [result.data, ...prev]);
      setGeneratedRecipe(null); setShowGenerator(false);
      setSuccessMessage(t.save + "!"); setTimeout(() => setSuccessMessage(null), 3000);
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteRecipe(id);
      if (!result.success) { setError(result.error); return; }
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    });
  }

  async function handleCreateShoppingList(recipeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await createListFromRecipe(recipeId);
      if (!result.success) { setError(result.error); return; }
      setSuccessMessage(`✅ "${result.data.name}"`);
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <button
          onClick={() => { setShowGenerator(true); setGeneratedRecipe(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
        >
          🤖 {t.generate}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-medium underline ml-2">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Generator */}
      {showGenerator && (
        <div className="bg-white border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{t.generate}</h3>
            <button onClick={() => { setShowGenerator(false); setGeneratedRecipe(null); }} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>

          {!generatedRecipe ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">
                    {t.selectIngredients} ({selectedItemIds.size}):
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedItemIds(new Set(pantryItems.map((i) => i.id)))} className="text-xs text-primary hover:underline">
                      {t.available}
                    </button>
                    <button onClick={() => setSelectedItemIds(new Set())} className="text-xs text-muted-foreground hover:underline">✕</button>
                  </div>
                </div>

                {pantryItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{t.noItems}</p>
                ) : (
                  <div className="space-y-4 max-h-72 overflow-y-auto">
                    {locationGroups.map((location) => {
                      const locationItems = pantryItems.filter((i) => i.location === location);
                      if (locationItems.length === 0) return null;
                      return (
                        <div key={location}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            {locationLabels[location]}
                          </p>
                          <div className="space-y-1">
                            {locationItems.map((item) => (
                              <label key={item.id} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-secondary">
                                <input type="checkbox" checked={selectedItemIds.has(item.id)}
                                  onChange={() => toggleItem(item.id)} className="w-4 h-4 accent-purple-600" />
                                <span className="text-sm text-foreground">
                                  {item.name}
                                  {item.quantity && <span className="text-muted-foreground"> ({item.quantity} {item.unit ?? ""})</span>}
                                  {item.isFrozen && <span className="text-xs text-cyan-500 ml-1">❄️</span>}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button onClick={handleGenerate} disabled={isPending || selectedItemIds.size === 0}
                className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm disabled:opacity-50">
                {isPending ? t.generating : `🤖 ${t.generate}`}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <h4 className="font-bold text-foreground text-lg">{generatedRecipe.title}</h4>
                <p className="text-muted-foreground text-sm mt-1">{generatedRecipe.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span>⏱️ {t.prepTime(generatedRecipe.prepTimeMinutes ?? 0)}</span>
                  <span>🍳 {t.cookTime(generatedRecipe.cookTimeMinutes ?? 0)}</span>
                  <span>👤 {t.servings(generatedRecipe.servings ?? 1)}</span>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-foreground mb-2 text-sm">{t.available} / {t.missing}:</h5>
                <ul className="space-y-1">
                  {generatedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span>{ing.availableInPantry ? "✅" : "❌"}</span>
                      <span className={ing.availableInPantry ? "text-foreground" : "text-muted-foreground"}>
                        {ing.name} {ing.quantity && `— ${ing.quantity} ${ing.unit ?? ""}`}
                      </span>
                      {!ing.availableInPantry && <span className="text-xs text-red-400">({t.missing})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-foreground whitespace-pre-line">{generatedRecipe.instructions}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveRecipe} disabled={isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
                  {isPending ? t.saving : `💾 ${t.save}`}
                </button>
                <button onClick={() => setGeneratedRecipe(null)}
                  className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition text-sm font-medium">
                  {t.generate}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recipes list */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">🍳</p>
          <p className="font-medium text-foreground">{t.noRecipes}</p>
          <p className="text-sm mt-1">{t.noRecipesHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t.saved}</h2>
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const availableCount = recipe.ingredients?.filter((i) => i.availableInPantry).length ?? 0;
            const totalCount = recipe.ingredients?.length ?? 0;
            const missingCount = totalCount - availableCount;

            return (
              <div key={recipe.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary transition"
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{recipe.title}</h3>
                      {recipe.aiGenerated && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full shrink-0">AI</span>
                      )}
                    </div>
                    {recipe.description && <p className="text-sm text-muted-foreground truncate mt-0.5">{recipe.description}</p>}
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      {recipe.prepTimeMinutes && <span>⏱️ {recipe.prepTimeMinutes} min</span>}
                      {recipe.servings && <span>👤 {t.servings(recipe.servings)}</span>}
                      {totalCount > 0 && (
                        <span className={missingCount > 0 ? "text-amber-500" : "text-primary"}>
                          {availableCount}/{totalCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <ul className="space-y-1">
                        {recipe.ingredients.map((ing) => (
                          <li key={ing.id} className="flex items-center gap-2 text-sm">
                            <span>{ing.availableInPantry ? "✅" : "❌"}</span>
                            <span className={ing.availableInPantry ? "text-foreground" : "text-muted-foreground"}>
                              {ing.name}{ing.quantity && ` — ${ing.quantity} ${ing.unit ?? ""}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-line">{recipe.instructions}</p>
                    <div className="flex gap-2 pt-1">
                      {missingCount > 0 && (
                        <button onClick={() => handleCreateShoppingList(recipe.id)} disabled={isPending}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium disabled:opacity-50">
                          🛒 {t.addToShopping} ({missingCount})
                        </button>
                      )}
                      <button onClick={() => handleDelete(recipe.id)} disabled={isPending}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium disabled:opacity-50">
                        🗑️ {t.delete}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

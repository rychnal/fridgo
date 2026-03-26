"use client";

import { useState, useTransition } from "react";
import { LOCATION_LABELS, type Location, type PantryItem, type Recipe, type GeneratedRecipe } from "@/types";
import { generateRecipe, saveRecipe, deleteRecipe } from "@/actions/recipe.actions";
import { createListFromRecipe } from "@/actions/shopping.actions";

interface RecipesClientProps {
  pantryItems: PantryItem[];
  initialRecipes: Recipe[];
  initialAction?: string;
}

export function RecipesClient({
  pantryItems,
  initialRecipes,
  initialAction,
}: RecipesClientProps) {
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedItemIds(new Set(pantryItems.map((i) => i.id)));
  }

  function clearSelection() {
    setSelectedItemIds(new Set());
  }

  async function handleGenerate() {
    if (selectedItemIds.size === 0) {
      setError("Vyberte alespoň jednu ingredienci");
      return;
    }
    setError(null);
    setGeneratedRecipe(null);

    startTransition(async () => {
      const result = await generateRecipe(Array.from(selectedItemIds));
      if (!result.success) {
        setError(result.error);
        return;
      }
      setGeneratedRecipe(result.data);
    });
  }

  async function handleSaveRecipe() {
    if (!generatedRecipe) return;
    setError(null);

    startTransition(async () => {
      const result = await saveRecipe({
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        instructions: generatedRecipe.instructions,
        prepTimeMinutes: generatedRecipe.prepTimeMinutes,
        cookTimeMinutes: generatedRecipe.cookTimeMinutes,
        servings: generatedRecipe.servings,
        aiGenerated: true,
        ingredients: generatedRecipe.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          availableInPantry: ing.availableInPantry,
        })),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setRecipes((prev) => [result.data, ...prev]);
      setGeneratedRecipe(null);
      setShowGenerator(false);
      setSuccessMessage("Recept byl uložen!");
      setTimeout(() => setSuccessMessage(null), 3000);
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteRecipe(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    });
  }

  async function handleCreateShoppingList(recipeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await createListFromRecipe(recipeId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccessMessage(`Nákupní seznam "${result.data.name}" byl vytvořen!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepty</h1>
          <p className="text-gray-500 mt-1">Recepty vygenerované z vašich zásobů</p>
        </div>
        <button
          onClick={() => { setShowGenerator(true); setGeneratedRecipe(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
        >
          🤖 Vygenerovat recept
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Zavřít</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          ✅ {successMessage}
        </div>
      )}

      {/* Recipe generator */}
      {showGenerator && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Vygenerovat recept pomocí AI</h3>
            <button onClick={() => { setShowGenerator(false); setGeneratedRecipe(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {!generatedRecipe ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Vyberte ingredience ({selectedItemIds.size} vybráno):
                  </p>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Vybrat vše</button>
                    <button onClick={clearSelection} className="text-xs text-gray-500 hover:underline">Zrušit výběr</button>
                  </div>
                </div>

                {pantryItems.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    Nejsou žádné zásoby. Nejprve přidejte ingredience.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-72 overflow-y-auto">
                    {locationGroups.map((location) => {
                      const locationItems = pantryItems.filter((i) => i.location === location);
                      if (locationItems.length === 0) return null;
                      return (
                        <div key={location}>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">
                            {LOCATION_LABELS[location]}
                          </p>
                          <div className="space-y-1">
                            {locationItems.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedItemIds.has(item.id)}
                                  onChange={() => toggleItem(item.id)}
                                  className="w-4 h-4 text-purple-600"
                                />
                                <span className="text-sm text-gray-900">
                                  {item.name}
                                  {item.quantity && (
                                    <span className="text-gray-400"> ({item.quantity} {item.unit ?? ""})</span>
                                  )}
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

              <button
                onClick={handleGenerate}
                disabled={isPending || selectedItemIds.size === 0}
                className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm disabled:opacity-50"
              >
                {isPending ? "Generování…" : "🤖 Vygenerovat recept"}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 text-lg">{generatedRecipe.title}</h4>
                <p className="text-gray-600 text-sm mt-1">{generatedRecipe.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span>⏱️ Příprava: {generatedRecipe.prepTimeMinutes} min</span>
                  <span>🍳 Vaření: {generatedRecipe.cookTimeMinutes} min</span>
                  <span>👤 Porce: {generatedRecipe.servings}</span>
                </div>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Ingredience:</h5>
                <ul className="space-y-1">
                  {generatedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className={ing.availableInPantry ? "text-green-500" : "text-red-400"}>
                        {ing.availableInPantry ? "✅" : "❌"}
                      </span>
                      <span className={ing.availableInPantry ? "text-gray-900" : "text-gray-400"}>
                        {ing.name} {ing.quantity && `— ${ing.quantity} ${ing.unit ?? ""}`}
                      </span>
                      {!ing.availableInPantry && (
                        <span className="text-xs text-red-400">(chybí)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Postup:</h5>
                <p className="text-sm text-gray-700 whitespace-pre-line">{generatedRecipe.instructions}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveRecipe}
                  disabled={isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {isPending ? "Ukládání…" : "💾 Uložit recept"}
                </button>
                <button
                  onClick={() => setGeneratedRecipe(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Generovat znovu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recipes list */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🍳</p>
          <p className="font-medium text-gray-600">Zatím žádné recepty</p>
          <p className="text-sm mt-1">Vygenerujte recept z vašich zásobů pomocí AI</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const availableCount = recipe.ingredients?.filter((i) => i.availableInPantry).length ?? 0;
            const totalCount = recipe.ingredients?.length ?? 0;
            const missingCount = totalCount - availableCount;

            return (
              <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{recipe.title}</h3>
                      {recipe.aiGenerated && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full shrink-0">
                          AI
                        </span>
                      )}
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{recipe.description}</p>
                    )}
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                      {recipe.prepTimeMinutes && <span>⏱️ {recipe.prepTimeMinutes} min</span>}
                      {recipe.servings && <span>👤 {recipe.servings} porc{recipe.servings === 1 ? "e" : "í"}</span>}
                      {totalCount > 0 && (
                        <span className={missingCount > 0 ? "text-amber-500" : "text-green-500"}>
                          {availableCount}/{totalCount} ingrediencí
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2 text-sm">Ingredience:</h5>
                        <ul className="space-y-1">
                          {recipe.ingredients.map((ing) => (
                            <li key={ing.id} className="flex items-center gap-2 text-sm">
                              <span>{ing.availableInPantry ? "✅" : "❌"}</span>
                              <span className={ing.availableInPantry ? "text-gray-900" : "text-gray-400"}>
                                {ing.name}
                                {ing.quantity && ` — ${ing.quantity} ${ing.unit ?? ""}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Postup:</h5>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{recipe.instructions}</p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {missingCount > 0 && (
                        <button
                          onClick={() => handleCreateShoppingList(recipe.id)}
                          disabled={isPending}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium disabled:opacity-50"
                        >
                          🛒 Nákupní seznam ({missingCount} položek)
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(recipe.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-medium disabled:opacity-50"
                      >
                        🗑️ Smazat
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

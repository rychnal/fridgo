export type {
  Database,
  PantryItemRow,
  PantryItemInsert,
  PantryItemUpdate,
  RecipeRow,
  RecipeInsert,
  RecipeUpdate,
  RecipeIngredientRow,
  RecipeIngredientInsert,
  RecipeIngredientUpdate,
  ShoppingListRow,
  ShoppingListInsert,
  ShoppingListUpdate,
  ShoppingItemRow,
  ShoppingItemInsert,
  ShoppingItemUpdate,
} from "./database";

// ─── Domain enums / unions ────────────────────────────────────────────────────

export type Location = "fridge" | "pantry" | "freezer";

export const LOCATION_LABELS: Record<Location, string> = {
  fridge: "Lednice",
  pantry: "Spíž",
  freezer: "Mrazák",
};

export type ItemSource = "manual" | "scan" | "purchase";

export const SOURCE_LABELS: Record<ItemSource, string> = {
  manual: "Ruční zadání",
  scan: "Skenování",
  purchase: "Nákup",
};

// ─── App-level types ──────────────────────────────────────────────────────────

/** Pantry item as used in the application layer */
export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  location: Location;
  isFrozen: boolean;
  source: ItemSource;
  scanImageUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatePantryItemInput {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  location: Location;
  isFrozen?: boolean;
  source?: ItemSource;
  scanImageUrl?: string | null;
  expiresAt?: string | null;
}

/** Recipe as used in the application layer */
export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  instructions: string;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  aiGenerated: boolean;
  createdAt: string;
  ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  availableInPantry: boolean;
}

export interface CreateRecipeInput {
  title: string;
  description?: string | null;
  instructions: string;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  servings?: number | null;
  aiGenerated?: boolean;
  ingredients: CreateRecipeIngredientInput[];
}

export interface CreateRecipeIngredientInput {
  name: string;
  quantity?: string | null;
  unit?: string | null;
  availableInPantry?: boolean;
}

/** Shopping list as used in the application layer */
export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  items?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  createdAt: string;
}

export interface CreateShoppingItemInput {
  name: string;
  quantity?: string | null;
  unit?: string | null;
}

// ─── AI / Scan types ──────────────────────────────────────────────────────────

export interface DetectedIngredient {
  name: string;
  quantity: string | null;
  unit: string | null;
  confidence: number; // 0–1
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
    availableInPantry: boolean;
  }[];
}

// ─── Server Action response wrapper ──────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

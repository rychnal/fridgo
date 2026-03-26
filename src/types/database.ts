export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pantry_items: {
        Row: PantryItemRow;
        Insert: PantryItemInsert;
        Update: PantryItemUpdate;
      };
      recipes: {
        Row: RecipeRow;
        Insert: RecipeInsert;
        Update: RecipeUpdate;
      };
      recipe_ingredients: {
        Row: RecipeIngredientRow;
        Insert: RecipeIngredientInsert;
        Update: RecipeIngredientUpdate;
      };
      shopping_lists: {
        Row: ShoppingListRow;
        Insert: ShoppingListInsert;
        Update: ShoppingListUpdate;
      };
      shopping_items: {
        Row: ShoppingItemRow;
        Insert: ShoppingItemInsert;
        Update: ShoppingItemUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      pantry_location: "fridge" | "pantry" | "freezer";
      item_source: "manual" | "scan" | "purchase";
    };
  };
}

// ─── pantry_items ─────────────────────────────────────────────────────────────

export interface PantryItemRow {
  id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  location: "fridge" | "pantry" | "freezer";
  is_frozen: boolean;
  source: "manual" | "scan" | "purchase";
  scan_image_url: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface PantryItemInsert {
  id?: string;
  user_id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  location?: "fridge" | "pantry" | "freezer";
  is_frozen?: boolean;
  source?: "manual" | "scan" | "purchase";
  scan_image_url?: string | null;
  expires_at?: string | null;
  created_at?: string;
}

export interface PantryItemUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  quantity?: string | null;
  unit?: string | null;
  location?: "fridge" | "pantry" | "freezer";
  is_frozen?: boolean;
  source?: "manual" | "scan" | "purchase";
  scan_image_url?: string | null;
  expires_at?: string | null;
  created_at?: string;
}

// ─── recipes ──────────────────────────────────────────────────────────────────

export interface RecipeRow {
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
}

export interface RecipeInsert {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  instructions: string;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  servings?: number | null;
  ai_generated?: boolean;
  created_at?: string;
}

export interface RecipeUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string | null;
  instructions?: string;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  servings?: number | null;
  ai_generated?: boolean;
  created_at?: string;
}

// ─── recipe_ingredients ───────────────────────────────────────────────────────

export interface RecipeIngredientRow {
  id: string;
  recipe_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  available_in_pantry: boolean;
}

export interface RecipeIngredientInsert {
  id?: string;
  recipe_id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  available_in_pantry?: boolean;
}

export interface RecipeIngredientUpdate {
  id?: string;
  recipe_id?: string;
  name?: string;
  quantity?: string | null;
  unit?: string | null;
  available_in_pantry?: boolean;
}

// ─── shopping_lists ───────────────────────────────────────────────────────────

export interface ShoppingListRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ShoppingListInsert {
  id?: string;
  user_id: string;
  name: string;
  created_at?: string;
}

export interface ShoppingListUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  created_at?: string;
}

// ─── shopping_items ───────────────────────────────────────────────────────────

export interface ShoppingItemRow {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
}

export interface ShoppingItemInsert {
  id?: string;
  list_id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  checked?: boolean;
  created_at?: string;
}

export interface ShoppingItemUpdate {
  id?: string;
  list_id?: string;
  name?: string;
  quantity?: string | null;
  unit?: string | null;
  checked?: boolean;
  created_at?: string;
}

-- ============================================================
-- Fridgo — Initial Database Migration
-- ============================================================

-- Enable UUID extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

-- pantry_items
CREATE TABLE IF NOT EXISTS pantry_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES auth.users NOT NULL,
  name          TEXT        NOT NULL,
  quantity      TEXT,
  unit          TEXT,
  location      TEXT        CHECK (location IN ('fridge', 'pantry', 'freezer')) DEFAULT 'fridge',
  is_frozen     BOOLEAN     DEFAULT false,
  source        TEXT        CHECK (source IN ('manual', 'scan', 'purchase')) DEFAULT 'manual',
  scan_image_url TEXT,
  expires_at    DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- recipes
CREATE TABLE IF NOT EXISTS recipes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        REFERENCES auth.users NOT NULL,
  title               TEXT        NOT NULL,
  description         TEXT,
  instructions        TEXT        NOT NULL,
  prep_time_minutes   INTEGER,
  cook_time_minutes   INTEGER,
  servings            INTEGER,
  ai_generated        BOOLEAN     DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id           UUID    REFERENCES recipes ON DELETE CASCADE NOT NULL,
  name                TEXT    NOT NULL,
  quantity            TEXT,
  unit                TEXT,
  available_in_pantry BOOLEAN DEFAULT false
);

-- shopping_lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users NOT NULL,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- shopping_items
CREATE TABLE IF NOT EXISTS shopping_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID        REFERENCES shopping_lists ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  quantity    TEXT,
  unit        TEXT,
  checked     BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

-- pantry_items
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id    ON pantry_items (user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_location   ON pantry_items (user_id, location);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expires_at ON pantry_items (expires_at) WHERE expires_at IS NOT NULL;

-- recipes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id    ON recipes (user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes (created_at DESC);

-- recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients (recipe_id);

-- shopping_lists
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id    ON shopping_lists (user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_at ON shopping_lists (created_at DESC);

-- shopping_items
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items (list_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE pantry_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items  ENABLE ROW LEVEL SECURITY;

-- ── pantry_items ──────────────────────────────────────────────

CREATE POLICY "Users can view their own pantry items"
  ON pantry_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pantry items"
  ON pantry_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items"
  ON pantry_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items"
  ON pantry_items FOR DELETE
  USING (auth.uid() = user_id);

-- ── recipes ───────────────────────────────────────────────────

CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- ── recipe_ingredients ────────────────────────────────────────
-- Access is controlled through the parent recipe's user_id

CREATE POLICY "Users can view ingredients of their recipes"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients for their recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients of their recipes"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients of their recipes"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- ── shopping_lists ────────────────────────────────────────────

CREATE POLICY "Users can view their own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- ── shopping_items ────────────────────────────────────────────
-- Access is controlled through the parent shopping_list's user_id

CREATE POLICY "Users can view items of their shopping lists"
  ON shopping_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items into their shopping lists"
  ON shopping_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their shopping lists"
  ON shopping_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their shopping lists"
  ON shopping_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
        AND shopping_lists.user_id = auth.uid()
    )
  );

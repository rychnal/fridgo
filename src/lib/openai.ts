import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Chybí proměnná prostředí OPENAI_API_KEY");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_VISION_MODEL = "gpt-4o-mini" as const;
export const OPENAI_RECIPE_MODEL = "gpt-4o-mini" as const;

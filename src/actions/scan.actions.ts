"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { openai, OPENAI_VISION_MODEL } from "@/lib/openai";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import type { ActionResult, DetectedIngredient, Location } from "@/types";

export async function scanImage(
  formData: FormData,
  location: Location
): Promise<ActionResult<{ ingredients: DetectedIngredient[]; imageUrl: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Uživatel není přihlášen" };
    }

    const file = formData.get("image") as File | null;
    if (!file) {
      return { success: false, error: "Nebyl vybrán žádný soubor" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Nepodporovaný formát souboru. Použijte JPEG, PNG nebo WebP." };
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return { success: false, error: "Soubor je příliš velký. Maximální velikost je 10 MB." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await uploadImageToCloudinary(
      buffer,
      `fridgo/scans/${user.id}`
    );

    const imageUrl = uploadResult.secure_url;
    const locationLabel = location === "fridge" ? "lednici" : location === "pantry" ? "spíži" : "mrazáku";
    const freezerNote = location === "freezer"
      ? "\nPozor: jde o mrazák, potraviny mohou být v obalech nebo zmrazené — identifikuj je podle obalů, popisků nebo tvaru."
      : "";

    // Send to OpenAI Vision
    const prompt = `Analyzuj tento obrázek ${locationLabel} a identifikuj všechny viditelné potraviny a ingredience.${freezerNote}

Pro každou položku uveď:
- název (česky)
- odhadované množství (pokud je viditelné nebo odhadnutelné)
- jednotku (ks, g, kg, l, ml, balení apod.)
- míru jistoty identifikace (0.0 až 1.0)

Odpověz VÝHRADNĚ ve formátu JSON (žádný markdown, žádný text navíc):
{
  "ingredients": [
    {
      "name": "název potraviny",
      "quantity": "množství nebo null",
      "unit": "jednotka nebo null",
      "confidence": 0.95
    }
  ]
}

Pokud na obrázku nejsou žádné potraviny, vrať prázdné pole ingredients.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "AI nevrátila žádnou odpověď" };
    }

    const parsed = JSON.parse(content) as { ingredients: DetectedIngredient[] };
    const ingredients = parsed.ingredients ?? [];

    return { success: true, data: { ingredients, imageUrl } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: `Skenování selhalo: ${message}` };
  }
}

export async function saveScanResults(
  ingredients: DetectedIngredient[],
  location: Location,
  imageUrl: string
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

    if (ingredients.length === 0) {
      return { success: false, error: "Žádné ingredience k uložení" };
    }

    const itemsToInsert = ingredients.map((ing) => ({
      user_id: user.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      location,
      is_frozen: location === "freezer",
      source: "scan" as const,
      scan_image_url: imageUrl,
    }));

    const { error } = await supabase
      .from("pantry_items")
      .insert(itemsToInsert);

    if (error) {
      return { success: false, error: `Nepodařilo se uložit výsledky skenování: ${error.message}` };
    }

    revalidatePath("/pantry");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return { success: false, error: message };
  }
}

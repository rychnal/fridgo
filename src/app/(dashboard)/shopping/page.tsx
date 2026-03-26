import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShoppingClient } from "./shopping-client";
import type { ShoppingList, ShoppingItem } from "@/types";

export const metadata: Metadata = {
  title: "Nákupní seznamy",
};

export default async function ShoppingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("shopping_lists")
    .select("*, shopping_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const shoppingLists: ShoppingList[] = (data ?? []).map((list) => ({
    id: list.id,
    userId: list.user_id,
    name: list.name,
    createdAt: list.created_at,
    items: (list.shopping_items ?? []).map(
      (item: {
        id: string;
        list_id: string;
        name: string;
        quantity: string | null;
        unit: string | null;
        checked: boolean;
        created_at: string;
      }): ShoppingItem => ({
        id: item.id,
        listId: item.list_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        checked: item.checked,
        createdAt: item.created_at,
      })
    ),
  }));

  return <ShoppingClient initialLists={shoppingLists} />;
}

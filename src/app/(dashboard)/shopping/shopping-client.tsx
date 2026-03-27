"use client";

import { useState, useTransition } from "react";
import type { ShoppingList, ShoppingItem } from "@/types";
import { createShoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem } from "@/actions/shopping.actions";
import { formatDate } from "@/lib/utils";
import { translations, type Locale } from "@/lib/i18n/translations";

interface ShoppingClientProps {
  initialLists: ShoppingList[];
  locale: Locale;
}

export function ShoppingClient({ initialLists, locale }: ShoppingClientProps) {
  const t = translations[locale].shopping;
  const [lists, setLists] = useState(initialLists);
  const [activeListId, setActiveListId] = useState<string | null>(initialLists[0]?.id ?? null);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeList = lists.find((l) => l.id === activeListId) ?? null;
  const checkedCount = activeList?.items?.filter((i) => i.checked).length ?? 0;
  const totalCount = activeList?.items?.length ?? 0;

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createShoppingList(newListName);
      if (!result.success) { setError(result.error); return; }
      const newList: ShoppingList = { ...result.data, items: [] };
      setLists((prev) => [newList, ...prev]);
      setActiveListId(newList.id);
      setNewListName(""); setShowNewList(false);
    });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeListId || !newItemName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addShoppingItem(activeListId, {
        name: newItemName, quantity: newItemQty || null, unit: newItemUnit || null,
      });
      if (!result.success) { setError(result.error); return; }
      setLists((prev) => prev.map((list) =>
        list.id === activeListId ? { ...list, items: [...(list.items ?? []), result.data] } : list
      ));
      setNewItemName(""); setNewItemQty(""); setNewItemUnit("");
    });
  }

  async function handleToggle(item: ShoppingItem) {
    setLists((prev) => prev.map((list) =>
      list.id === item.listId
        ? { ...list, items: list.items?.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i) }
        : list
    ));
    startTransition(async () => {
      const result = await toggleShoppingItem(item.id);
      if (!result.success) {
        setLists((prev) => prev.map((list) =>
          list.id === item.listId
            ? { ...list, items: list.items?.map((i) => i.id === item.id ? { ...i, checked: item.checked } : i) }
            : list
        ));
        setError(result.error);
      }
    });
  }

  async function handleDeleteItem(item: ShoppingItem) {
    setError(null);
    startTransition(async () => {
      const result = await deleteShoppingItem(item.id);
      if (!result.success) { setError(result.error); return; }
      setLists((prev) => prev.map((list) =>
        list.id === item.listId ? { ...list, items: list.items?.filter((i) => i.id !== item.id) } : list
      ));
    });
  }

  const uncheckedItems = activeList?.items?.filter((i) => !i.checked) ?? [];
  const checkedItems = activeList?.items?.filter((i) => i.checked) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <button onClick={() => setShowNewList(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          ➕ {t.newList}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-medium underline ml-2">✕</button>
        </div>
      )}

      {showNewList && (
        <div className="bg-white border border-border rounded-xl p-4">
          <form onSubmit={handleCreateList} className="flex gap-2">
            <input type="text" required value={newListName} onChange={(e) => setNewListName(e.target.value)}
              placeholder={t.listName} autoFocus
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
            <button type="submit" disabled={isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
              {t.create}
            </button>
            <button type="button" onClick={() => { setShowNewList(false); setNewListName(""); }}
              className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition text-sm font-medium">
              {t.cancel}
            </button>
          </form>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">🛒</p>
          <p className="font-medium text-foreground">{t.noLists}</p>
          <p className="text-sm mt-1">{t.noListsHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.title}</h2>
            {lists.map((list) => {
              const itemCount = list.items?.length ?? 0;
              const done = list.items?.filter((i) => i.checked).length ?? 0;
              const isComplete = itemCount > 0 && done === itemCount;
              return (
                <button key={list.id} onClick={() => setActiveListId(list.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    activeListId === list.id ? "border-primary bg-accent" : "border-border bg-white hover:border-primary/30"
                  }`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm truncate">{list.name}</p>
                    {isComplete && <span className="text-primary text-xs">✅</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {done}/{itemCount} · {formatDate(list.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active list */}
          <div className="md:col-span-2">
            {activeList ? (
              <div className="bg-white border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-foreground">{activeList.name}</h2>
                    <p className="text-sm text-muted-foreground">{checkedCount} / {totalCount}</p>
                  </div>
                  {totalCount > 0 && (
                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all"
                        style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }} />
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddItem} className="flex gap-2">
                  <input type="text" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={t.itemPlaceholder}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
                  <input type="text" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="qty" className="w-14 px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="submit" disabled={isPending}
                    className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
                    {t.add}
                  </button>
                </form>

                {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t.noListsHint}</p>
                ) : (
                  <div className="space-y-1">
                    {uncheckedItems.map((item) => (
                      <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDeleteItem} isPending={isPending} />
                    ))}
                    {checkedItems.length > 0 && uncheckedItems.length > 0 && (
                      <p className="text-xs text-muted-foreground pt-3 pb-1 font-medium">✓ {checkedItems.length}</p>
                    )}
                    {checkedItems.map((item) => (
                      <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDeleteItem} isPending={isPending} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">{t.noLists}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete, isPending }: {
  item: ShoppingItem; onToggle: (i: ShoppingItem) => void;
  onDelete: (i: ShoppingItem) => void; isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 group">
      <button onClick={() => onToggle(item)} disabled={isPending}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
          item.checked ? "bg-primary border-primary text-white" : "border-border hover:border-primary"
        }`}>
        {item.checked && <span className="text-xs">✓</span>}
      </button>
      <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {item.name}
        {item.quantity && <span className="text-muted-foreground ml-1">— {item.quantity} {item.unit ?? ""}</span>}
      </span>
      <button onClick={() => onDelete(item)} disabled={isPending}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 rounded transition">
        🗑️
      </button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { ShoppingList, ShoppingItem } from "@/types";
import {
  createShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
} from "@/actions/shopping.actions";
import { formatDate } from "@/lib/utils";

interface ShoppingClientProps {
  initialLists: ShoppingList[];
}

export function ShoppingClient({ initialLists }: ShoppingClientProps) {
  const [lists, setLists] = useState(initialLists);
  const [activeListId, setActiveListId] = useState<string | null>(
    initialLists[0]?.id ?? null
  );
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
      if (!result.success) {
        setError(result.error);
        return;
      }

      const newList: ShoppingList = { ...result.data, items: [] };
      setLists((prev) => [newList, ...prev]);
      setActiveListId(newList.id);
      setNewListName("");
      setShowNewList(false);
    });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeListId || !newItemName.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addShoppingItem(activeListId, {
        name: newItemName,
        quantity: newItemQty || null,
        unit: newItemUnit || null,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setLists((prev) =>
        prev.map((list) =>
          list.id === activeListId
            ? { ...list, items: [...(list.items ?? []), result.data] }
            : list
        )
      );
      setNewItemName("");
      setNewItemQty("");
      setNewItemUnit("");
    });
  }

  async function handleToggle(item: ShoppingItem) {
    setError(null);

    // Optimistic update
    setLists((prev) =>
      prev.map((list) =>
        list.id === item.listId
          ? {
              ...list,
              items: list.items?.map((i) =>
                i.id === item.id ? { ...i, checked: !i.checked } : i
              ),
            }
          : list
      )
    );

    startTransition(async () => {
      const result = await toggleShoppingItem(item.id);
      if (!result.success) {
        // Revert optimistic update
        setLists((prev) =>
          prev.map((list) =>
            list.id === item.listId
              ? {
                  ...list,
                  items: list.items?.map((i) =>
                    i.id === item.id ? { ...i, checked: item.checked } : i
                  ),
                }
              : list
          )
        );
        setError(result.error);
      }
    });
  }

  async function handleDeleteItem(item: ShoppingItem) {
    setError(null);
    startTransition(async () => {
      const result = await deleteShoppingItem(item.id);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setLists((prev) =>
        prev.map((list) =>
          list.id === item.listId
            ? { ...list, items: list.items?.filter((i) => i.id !== item.id) }
            : list
        )
      );
    });
  }

  const uncheckedItems = activeList?.items?.filter((i) => !i.checked) ?? [];
  const checkedItems = activeList?.items?.filter((i) => i.checked) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nákupní seznamy</h1>
          <p className="text-gray-500 mt-1">Váš nákupní pomocník</p>
        </div>
        <button
          onClick={() => setShowNewList(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          ➕ Nový seznam
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Zavřít</button>
        </div>
      )}

      {/* New list form */}
      {showNewList && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <form onSubmit={handleCreateList} className="flex gap-2">
            <input
              type="text"
              required
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Název nového seznamu…"
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
            >
              Vytvořit
            </button>
            <button
              type="button"
              onClick={() => { setShowNewList(false); setNewListName(""); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Zrušit
            </button>
          </form>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🛒</p>
          <p className="font-medium text-gray-600">Žádné nákupní seznamy</p>
          <p className="text-sm mt-1">
            Vytvořte nový seznam nebo ho automaticky vygenerujte z receptu
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lists sidebar */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Vaše seznamy
            </h2>
            {lists.map((list) => {
              const itemCount = list.items?.length ?? 0;
              const checkedCount = list.items?.filter((i) => i.checked).length ?? 0;
              const isComplete = itemCount > 0 && checkedCount === itemCount;

              return (
                <button
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    activeListId === list.id
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm truncate">{list.name}</p>
                    {isComplete && <span className="text-green-500 text-xs">✅</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {checkedCount}/{itemCount} položek · {formatDate(list.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active list */}
          <div className="md:col-span-2">
            {activeList ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                {/* List header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">{activeList.name}</h2>
                    <p className="text-sm text-gray-400">
                      {checkedCount} z {totalCount} splněno
                    </p>
                  </div>
                  {totalCount > 0 && (
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Add item form */}
                <form onSubmit={handleAddItem} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Přidat položku…"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="text"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="Množ."
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Jedn."
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                  >
                    ➕
                  </button>
                </form>

                {/* Items */}
                {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Seznam je prázdný. Přidejte první položku.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {/* Unchecked items */}
                    {uncheckedItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDeleteItem}
                        isPending={isPending}
                      />
                    ))}

                    {/* Divider for checked items */}
                    {checkedItems.length > 0 && uncheckedItems.length > 0 && (
                      <p className="text-xs text-gray-400 pt-3 pb-1 font-medium">
                        Splněno ({checkedItems.length})
                      </p>
                    )}

                    {/* Checked items */}
                    {checkedItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDeleteItem}
                        isPending={isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p>Vyberte seznam vlevo</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
  isPending,
}: {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 group">
      <button
        onClick={() => onToggle(item)}
        disabled={isPending}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
          item.checked
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-green-400"
        }`}
      >
        {item.checked && <span className="text-xs">✓</span>}
      </button>
      <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-900"}`}>
        {item.name}
        {item.quantity && (
          <span className="text-gray-400 ml-1">
            — {item.quantity} {item.unit ?? ""}
          </span>
        )}
      </span>
      <button
        onClick={() => onDelete(item)}
        disabled={isPending}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition"
        title="Smazat"
      >
        🗑️
      </button>
    </div>
  );
}

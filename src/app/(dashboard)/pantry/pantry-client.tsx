"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { LOCATION_LABELS, type Location, type PantryItem, type DetectedIngredient } from "@/types";
import { addPantryItem, deletePantryItem } from "@/actions/pantry.actions";
import { scanImage, saveScanResults } from "@/actions/scan.actions";
import { formatRelativeDate } from "@/lib/utils";

interface PantryClientProps {
  initialItems: PantryItem[];
  initialTab: Location;
  initialAction?: string;
}

type Tab = Location;

export function PantryClient({
  initialItems,
  initialTab,
  initialAction,
}: PantryClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState(initialItems);
  const [showAddForm, setShowAddForm] = useState(initialAction === "add");
  const [showScanForm, setShowScanForm] = useState(initialAction === "scan");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newExpires, setNewExpires] = useState("");

  // Scan state
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<DetectedIngredient[] | null>(null);
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  const [selectedScanItems, setSelectedScanItems] = useState<Set<number>>(new Set());

  const filteredItems = items.filter((i) => i.location === activeTab);

  const tabs: Tab[] = ["fridge", "pantry", "freezer"];
  const tabIcons: Record<Tab, string> = { fridge: "🧊", pantry: "🥫", freezer: "❄️" };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setScanFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setScanPreview(url);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addPantryItem({
        name: newName,
        quantity: newQuantity || null,
        unit: newUnit || null,
        location: activeTab,
        isFrozen: activeTab === "freezer",
        expiresAt: newExpires || null,
        source: "manual",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setItems((prev) => [result.data, ...prev]);
      setNewName("");
      setNewQuantity("");
      setNewUnit("");
      setNewExpires("");
      setShowAddForm(false);
    });
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!scanFile || activeTab === "freezer") return;
    setError(null);

    const formData = new FormData();
    formData.append("image", scanFile);

    startTransition(async () => {
      const result = await scanImage(formData, activeTab as "fridge" | "pantry");
      if (!result.success) {
        setError(result.error);
        return;
      }
      setScanResults(result.data.ingredients);
      setScanImageUrl(result.data.imageUrl);
      setSelectedScanItems(new Set(result.data.ingredients.map((_, i) => i)));
    });
  }

  async function handleSaveScan() {
    if (!scanResults || !scanImageUrl) return;
    setError(null);

    const selected = scanResults.filter((_, i) => selectedScanItems.has(i));
    if (selected.length === 0) {
      setError("Vyberte alespoň jednu ingredienci");
      return;
    }

    startTransition(async () => {
      const result = await saveScanResults(selected, activeTab, scanImageUrl);
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Reload page to get fresh data
      window.location.reload();
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deletePantryItem(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zásoby</h1>
          <p className="text-gray-500 mt-1">Správa ingrediencí ve vašich zásobách</p>
        </div>
        <div className="flex gap-2">
          {activeTab !== "freezer" && (
            <button
              onClick={() => { setShowScanForm(true); setShowAddForm(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              📷 Skenovat
            </button>
          )}
          <button
            onClick={() => { setShowAddForm(true); setShowScanForm(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            ➕ Přidat
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => {
          const count = items.filter((i) => i.location === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tabIcons[tab]}</span>
              {LOCATION_LABELS[tab]}
              {count > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Zavřít</button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            Přidat do {LOCATION_LABELS[activeTab].toLowerCase()}
          </h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Název *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="např. Mléko"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Množství
                </label>
                <input
                  type="text"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="např. 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jednotka
                </label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="např. l, kg, ks"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum spotřeby
              </label>
              <input
                type="date"
                value={newExpires}
                onChange={(e) => setNewExpires(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
              >
                {isPending ? "Přidávání…" : "Přidat"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scan form */}
      {showScanForm && activeTab !== "freezer" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            Skenovat {LOCATION_LABELS[activeTab].toLowerCase()}
          </h3>

          {!scanResults ? (
            <form onSubmit={handleScan} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                {scanPreview ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={scanPreview}
                      alt="Náhled"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <p className="text-4xl mb-2">📷</p>
                    <p className="text-sm">Vyberte fotografii lednice nebo spíže</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="mt-4 text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:bg-gray-100 file:rounded-lg file:text-sm file:cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending || !scanFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {isPending ? "Analyzování…" : "Analyzovat AI"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowScanForm(false); setScanFile(null); setScanPreview(null); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Zrušit
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                AI rozpoznala {scanResults.length} ingrediencí. Vyberte, které chcete přidat:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scanResults.map((ing, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScanItems.has(i)}
                      onChange={(e) => {
                        const next = new Set(selectedScanItems);
                        if (e.target.checked) next.add(i);
                        else next.delete(i);
                        setSelectedScanItems(next);
                      }}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="flex-1 text-sm text-gray-900">
                      <strong>{ing.name}</strong>
                      {ing.quantity && (
                        <span className="text-gray-500">
                          {" "}— {ing.quantity} {ing.unit ?? ""}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(ing.confidence * 100)}% jistota
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveScan}
                  disabled={isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {isPending ? "Ukládání…" : `Přidat vybrané (${selectedScanItems.size})`}
                </button>
                <button
                  onClick={() => { setScanResults(null); setScanFile(null); setScanPreview(null); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Skenovat znovu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">{tabIcons[activeTab]}</p>
          <p className="font-medium text-gray-600">
            {LOCATION_LABELS[activeTab]} je prázdná
          </p>
          <p className="text-sm mt-1">
            {activeTab === "freezer"
              ? "Přidejte položky ručně"
              : "Přidejte položky ručně nebo naskenujte fotku"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity && `${item.quantity} ${item.unit ?? ""}`}
                  {item.expiresAt && (
                    <span className={`ml-2 ${
                      new Date(item.expiresAt) < new Date() ? "text-red-500" :
                      new Date(item.expiresAt) < new Date(Date.now() + 3 * 86400000) ? "text-amber-500" :
                      "text-gray-400"
                    }`}>
                      · {formatRelativeDate(item.expiresAt)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.source === "scan" && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    sken
                  </span>
                )}
                {item.isFrozen && (
                  <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">
                    ❄️ zmrazené
                  </span>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title="Smazat"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

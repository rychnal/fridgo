"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { type Location, type PantryItem, type DetectedIngredient } from "@/types";
import { addPantryItem, deletePantryItem } from "@/actions/pantry.actions";
import { scanImage, saveScanResults } from "@/actions/scan.actions";
import { formatRelativeDate } from "@/lib/utils";
import { translations, type Locale } from "@/lib/i18n/translations";

interface PantryClientProps {
  initialItems: PantryItem[];
  initialTab: Location;
  initialAction?: string;
  locale: Locale;
}

type Tab = Location;

export function PantryClient({ initialItems, initialTab, initialAction, locale }: PantryClientProps) {
  const t = translations[locale].pantry;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState(initialItems);
  const [showAddForm, setShowAddForm] = useState(initialAction === "add");
  const [showScanForm, setShowScanForm] = useState(initialAction === "scan");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newExpires, setNewExpires] = useState("");

  const [scanFiles, setScanFiles] = useState<File[]>([]);
  const [scanPreviews, setScanPreviews] = useState<string[]>([]);
  const [scanResults, setScanResults] = useState<DetectedIngredient[] | null>(null);
  const [scanImageUrl, setScanImageUrl] = useState<string | null>(null);
  const [selectedScanItems, setSelectedScanItems] = useState<Set<number>>(new Set());
  const [editedNames, setEditedNames] = useState<Record<number, string>>({});
  const [scanProgress, setScanProgress] = useState<{ done: number; total: number } | null>(null);

  const filteredItems = items.filter((i) => i.location === activeTab);

  const tabs: Tab[] = ["fridge", "pantry", "freezer"];
  const tabLabels: Record<Tab, string> = {
    fridge: t.fridge,
    pantry: t.pantryLabel,
    freezer: t.freezer,
  };
  const tabIcons: Record<Tab, string> = { fridge: "🧊", pantry: "🥫", freezer: "❄️" };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setScanFiles(files);
    setScanPreviews(files.map((f) => URL.createObjectURL(f)));
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
      if (!result.success) { setError(result.error); return; }
      setItems((prev) => [result.data, ...prev]);
      setNewName(""); setNewQuantity(""); setNewUnit(""); setNewExpires("");
      setShowAddForm(false);
    });
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (scanFiles.length === 0) return;
    setError(null);
    setScanProgress({ done: 0, total: scanFiles.length });

    startTransition(async () => {
      const allIngredients: DetectedIngredient[] = [];
      let lastImageUrl = "";

      for (let idx = 0; idx < scanFiles.length; idx++) {
        const formData = new FormData();
        formData.append("image", scanFiles[idx]);
        const result = await scanImage(formData, activeTab);
        if (!result.success) { setError(result.error); setScanProgress(null); return; }
        allIngredients.push(...result.data.ingredients);
        lastImageUrl = result.data.imageUrl;
        setScanProgress({ done: idx + 1, total: scanFiles.length });
      }

      setScanResults(allIngredients);
      setScanImageUrl(lastImageUrl);
      setSelectedScanItems(new Set(allIngredients.map((_, i) => i)));
      setEditedNames({});
      setScanProgress(null);
    });
  }

  async function handleSaveScan() {
    if (!scanResults || !scanImageUrl) return;
    setError(null);
    const selected = scanResults
      .filter((_, i) => selectedScanItems.has(i))
      .map((ing, i) => ({ ...ing, name: editedNames[i] ?? ing.name }));
    if (selected.length === 0) { setError(t.selectAtLeast); return; }
    startTransition(async () => {
      const result = await saveScanResults(selected, activeTab, scanImageUrl);
      if (!result.success) { setError(result.error); return; }
      window.location.reload();
    });
  }

  async function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deletePantryItem(id);
      if (!result.success) { setError(result.error); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowScanForm(true); setShowAddForm(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            📷 {t.scan}
          </button>
          <button
            onClick={() => { setShowAddForm(true); setShowScanForm(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium"
          >
            ➕ {t.addItem}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl">
        {tabs.map((tab) => {
          const count = items.filter((i) => i.location === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
                activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tabIcons[tab]}</span>
              {tabLabels[tab]}
              {count > 0 && (
                <span className="bg-accent text-primary text-xs px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">{t.cancel}</button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">{t.addTo(tabLabels[activeTab])}</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t.nameLabel}</label>
              <input
                type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                placeholder={t.namePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.quantityLabel}</label>
                <input
                  type="text" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  placeholder={t.quantityPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t.unitLabel}</label>
                <input
                  type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                  placeholder={t.unitPlaceholder}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t.expiryLabel}</label>
              <input
                type="date" value={newExpires} onChange={(e) => setNewExpires(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
                {isPending ? t.adding : t.addButton}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition text-sm font-medium">
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scan form */}
      {showScanForm && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">{t.scanLabel(tabLabels[activeTab])}</h3>
          {!scanResults ? (
            <form onSubmit={handleScan} className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-4">
                {scanPreviews.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {scanPreviews.map((src, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 group">
                        <Image src={src} alt={`Náhled ${i + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setScanFiles((prev) => prev.filter((_, j) => j !== i));
                            setScanPreviews((prev) => prev.filter((_, j) => j !== i));
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-4xl mb-2">📷</p>
                    <p className="text-sm">{t.scanHint}</p>
                  </div>
                )}
                <input
                  type="file" accept="image/*" multiple onChange={handleFileChange}
                  className="mt-3 text-sm text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:border-0 file:bg-secondary file:rounded-lg file:text-sm file:cursor-pointer w-full"
                />
                {scanFiles.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">{scanFiles.length} obrázky vybrány</p>
                )}
              </div>

              {scanProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.scanning}</span>
                    <span>{scanProgress.done}/{scanProgress.total}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(scanProgress.done / scanProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" disabled={isPending || scanFiles.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
                  {isPending ? t.scanning : t.scanButton}
                </button>
                <button type="button" onClick={() => { setShowScanForm(false); setScanFiles([]); setScanPreviews([]); }}
                  className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition text-sm font-medium">
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.aiDetected(scanResults.length)}</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {scanResults.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-secondary">
                    <input type="checkbox" checked={selectedScanItems.has(i)}
                      onChange={(e) => {
                        const next = new Set(selectedScanItems);
                        if (e.target.checked) next.add(i); else next.delete(i);
                        setSelectedScanItems(next);
                      }}
                      className="w-4 h-4 accent-primary shrink-0"
                    />
                    <input
                      type="text"
                      value={editedNames[i] ?? ing.name}
                      onChange={(e) => setEditedNames((prev) => ({ ...prev, [i]: e.target.value }))}
                      className="flex-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-0 py-0.5 transition-colors"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {t.confidence(Math.round(ing.confidence * 100))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveScan} disabled={isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
                  {isPending ? t.saving : t.addSelected(selectedScanItems.size)}
                </button>
                <button onClick={() => { setScanResults(null); setScanFiles([]); setScanPreviews([]); }}
                  className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition text-sm font-medium">
                  {t.scanAgain}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-5xl mb-4">{tabIcons[activeTab]}</p>
          <p className="font-medium text-foreground">{t.empty(tabLabels[activeTab])}</p>
          <p className="text-sm mt-1">{activeTab === "freezer" ? t.emptyHintFreezer : t.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-3 hover:shadow-sm transition">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity && `${item.quantity} ${item.unit ?? ""}`}
                  {item.expiresAt && (
                    <span className={`ml-2 ${
                      new Date(item.expiresAt) < new Date() ? "text-red-500" :
                      new Date(item.expiresAt) < new Date(Date.now() + 3 * 86400000) ? "text-amber-500" :
                      "text-muted-foreground"
                    }`}>
                      · {formatRelativeDate(item.expiresAt)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.source === "scan" && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t.sourceScan}</span>
                )}
                {item.isFrozen && (
                  <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">❄️ {t.frozen}</span>
                )}
                <button onClick={() => handleDelete(item.id)} disabled={isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title={t.delete}>
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

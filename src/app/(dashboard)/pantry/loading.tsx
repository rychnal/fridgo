export default function PantryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-24 bg-secondary rounded-full" />
          <div className="h-4 w-48 bg-secondary rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-secondary rounded-lg" />
          <div className="h-9 w-20 bg-secondary rounded-lg" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl">
        <div className="flex-1 h-9 bg-white rounded-lg shadow-sm" />
        <div className="flex-1 h-9 rounded-lg" />
        <div className="flex-1 h-9 rounded-lg" />
      </div>
      {/* Items */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-secondary rounded-full" />
            <div className="h-3 w-20 bg-secondary rounded-full" />
          </div>
          <div className="h-7 w-7 bg-secondary rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function ShoppingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-secondary rounded-full" />
        <div className="h-9 w-36 bg-secondary rounded-lg" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-4 space-y-3">
          <div className="h-4 w-40 bg-secondary rounded-full" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-secondary rounded" />
              <div className="h-3 flex-1 bg-secondary rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function RecipesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-24 bg-secondary rounded-full" />
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="h-4 w-48 bg-secondary rounded-full" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-secondary rounded-lg" />
          ))}
        </div>
        <div className="h-10 w-40 bg-secondary rounded-lg" />
      </div>
      <div className="h-5 w-32 bg-secondary rounded-full" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border h-20" />
      ))}
    </div>
  );
}

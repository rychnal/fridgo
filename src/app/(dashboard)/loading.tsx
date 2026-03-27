export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-border h-24" />
        <div className="bg-white rounded-xl border border-border h-24" />
      </div>
      {/* Section title */}
      <div className="h-4 w-20 bg-secondary rounded-full" />
      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border h-28" />
        <div className="bg-white rounded-xl border border-border h-28" />
        <div className="bg-white rounded-xl border border-border h-28" />
      </div>
      {/* Section title */}
      <div className="h-4 w-24 bg-secondary rounded-full" />
      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="bg-white rounded-xl border border-border h-16" />
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-border h-16" />
          <div className="bg-white rounded-xl border border-border h-16" />
        </div>
        <div className="bg-white rounded-xl border border-border h-16" />
      </div>
    </div>
  );
}

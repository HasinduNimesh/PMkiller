export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded bg-base-300" />
          <div className="h-4 w-64 rounded bg-base-300" />
        </div>
        <div className="h-10 w-32 rounded bg-base-300" />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-box bg-base-200" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 rounded-box bg-base-200" />
        <div className="h-48 rounded-box bg-base-200" />
      </div>
    </div>
  );
}

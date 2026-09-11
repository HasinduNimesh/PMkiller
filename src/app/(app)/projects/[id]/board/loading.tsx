export default function BoardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-base-300" />
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-9 w-56 rounded bg-base-300" />
          <div className="h-4 w-72 rounded bg-base-300" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded bg-base-300" />
          <div className="h-8 w-28 rounded bg-base-300" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-h-64 rounded-box bg-base-200/70 p-2">
            <div className="mb-3 h-4 w-20 rounded bg-base-300" />
            <div className="space-y-2">
              <div className="h-24 rounded-box bg-base-100" />
              <div className="h-20 rounded-box bg-base-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

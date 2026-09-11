export default function BacklogLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-base-300" />
      <div className="space-y-2">
        <div className="h-9 w-64 rounded bg-base-300" />
        <div className="h-4 w-80 rounded bg-base-300" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body gap-3">
            <div className="h-6 w-32 rounded bg-base-300" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-base-200" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-36 rounded-box bg-base-200" />
          <div className="h-28 rounded-box bg-base-200" />
        </div>
      </div>
    </div>
  );
}

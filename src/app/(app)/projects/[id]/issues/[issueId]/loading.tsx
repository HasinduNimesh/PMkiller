export default function IssueLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-base-300" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-base-300" />
          <div className="h-9 w-80 max-w-full rounded bg-base-300" />
        </div>
        <div className="h-8 w-20 rounded bg-base-300" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="h-40 rounded-box bg-base-200" />
          <div className="h-32 rounded-box bg-base-200" />
        </div>
        <div className="h-64 rounded-box bg-base-200" />
      </div>
    </div>
  );
}

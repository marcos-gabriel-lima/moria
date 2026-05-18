export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-moria-elevated rounded-lg" />
        <div className="h-9 w-32 bg-moria-surface rounded-lg border border-moria-border" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
    </div>
  )
}

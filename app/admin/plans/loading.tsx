export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-28 bg-moria-elevated rounded-lg" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-moria-surface border border-moria-border" />
    </div>
  )
}

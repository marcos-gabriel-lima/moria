export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-moria-elevated rounded-lg" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-moria-surface border border-moria-border" />
      <div className="h-48 rounded-xl bg-moria-surface border border-moria-border" />
    </div>
  )
}

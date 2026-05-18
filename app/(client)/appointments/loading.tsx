export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-44 bg-moria-elevated rounded-lg" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
    </div>
  )
}

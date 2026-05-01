export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-moria-elevated rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
    </div>
  )
}

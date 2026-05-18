export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-moria-elevated rounded-lg" />
      <div className="h-10 w-full bg-moria-surface rounded-lg border border-moria-border" />
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
    </div>
  )
}

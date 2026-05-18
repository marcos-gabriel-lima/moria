export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-moria-elevated rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-52 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-moria-elevated rounded-lg" />
          <div className="h-4 w-52 bg-moria-elevated rounded" />
        </div>
        <div className="h-4 w-44 bg-moria-elevated rounded" />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="h-6 w-36 bg-moria-elevated rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-moria-surface border border-moria-border" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-6 w-40 bg-moria-elevated rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-moria-surface border border-gold-DEFAULT/20" />
          ))}
        </div>
      </div>
    </div>
  )
}

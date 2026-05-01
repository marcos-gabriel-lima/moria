export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-moria-elevated rounded-lg" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-xl bg-moria-surface border border-moria-border" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-moria-surface border border-moria-border" />
    </div>
  )
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Pipeline steps */}
      <div className="glass p-4">
        <p className="text-xs font-medium text-slate-400 mb-3">Running AI pipeline…</p>
        <div className="space-y-2.5">
          {[
            '1. Analyzing code structure…',
            '2. Generating test cases…',
            '3. Detecting edge cases…',
            '4. Evaluating coverage…',
            '5. Building explanation…',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full shimmer shrink-0" />
              <div className="flex-1 h-3 rounded-full shimmer" style={{ width: `${60 + i * 8}%`, animationDelay: `${i * 120}ms` }} />
              <span className="text-xs text-slate-600">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton cards */}
      {[1, 2, 3].map(i => (
        <div key={i} className="glass p-4 space-y-3">
          <div className="flex gap-3">
            <div className="w-full h-4 rounded-lg shimmer" />
            <div className="w-16 h-4 rounded-lg shimmer shrink-0" />
          </div>
          <div className="w-4/5 h-3 rounded shimmer" />
          <div className="flex gap-2">
            <div className="w-16 h-5 rounded shimmer" />
            <div className="w-20 h-5 rounded shimmer" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 rounded-lg shimmer" />
            <div className="h-14 rounded-lg shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

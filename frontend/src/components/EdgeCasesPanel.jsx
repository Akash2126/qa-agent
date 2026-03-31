import { ShieldAlert, AlertTriangle, Info, Lightbulb } from 'lucide-react'

const RISK = {
  critical: { Icon: ShieldAlert, ring: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.2)', dot: 'bg-red-500',    label: 'badge-critical', text: 'text-red-400' },
  high:     { Icon: AlertTriangle, ring: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: 'bg-amber-500', label: 'badge-high',    text: 'text-amber-400' },
  medium:   { Icon: AlertTriangle, ring: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.2)',  dot: 'bg-yellow-500', label: 'badge-medium', text: 'text-yellow-400' },
  low:      { Icon: Info,          ring: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)', dot: 'bg-green-500', label: 'badge-low',     text: 'text-green-400' },
}

function EdgeCard({ ec, index }) {
  const cfg = RISK[ec.risk_level] || RISK.medium
  const { Icon } = cfg
  return (
    <div className="rounded-xl p-4 animate-fade-up" style={{ animationDelay: `${index * 50}ms`, background: cfg.ring, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
          style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${cfg.border}` }}>
          <Icon className={`w-4 h-4 ${cfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p className="text-sm font-semibold text-slate-100 font-mono">{ec.scenario.replace(/_/g, ' ')}</p>
            <span className={ec.label || cfg.label}>{ec.risk_level}</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-3">{ec.description}</p>
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">{ec.suggestion}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EdgeCasesPanel({ edge_cases }) {
  const sorted = [...(edge_cases || [])].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return (order[a.risk_level] ?? 4) - (order[b.risk_level] ?? 4)
  })
  const critCount = sorted.filter(e => e.risk_level === 'critical').length
  const highCount = sorted.filter(e => e.risk_level === 'high').length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-400">{sorted.length} edge cases</span>
        {critCount > 0 && <span className="badge-critical">{critCount} critical</span>}
        {highCount > 0 && <span className="badge-high">{highCount} high risk</span>}
      </div>
      <div className="space-y-2.5">
        {sorted.map((ec, i) => <EdgeCard key={ec.id} ec={ec} index={i} />)}
        {sorted.length === 0 && <div className="text-center py-10 text-slate-600 text-sm">No edge cases detected.</div>}
      </div>
    </div>
  )
}

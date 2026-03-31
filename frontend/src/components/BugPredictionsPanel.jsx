import { useState } from 'react'
import { Bug, ChevronDown, ChevronUp, ShieldOff, Cpu } from 'lucide-react'

const SEV_CONFIG = {
  critical: { ring: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.25)', badge: 'badge-critical', dot: 'bg-red-500' },
  high:     { ring: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',  badge: 'badge-high',    dot: 'bg-amber-500' },
  medium:   { ring: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.18)', badge: 'badge-medium',  dot: 'bg-yellow-500' },
  low:      { ring: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)', badge: 'badge-low',     dot: 'bg-green-500' },
}

const CAT_ICONS = {
  logic_error:'⚠', null_reference:'∅', off_by_one:'±1', race_condition:'⟳',
  security:'🔐', memory:'💾', recursion_overflow:'∞', unhandled_exception:'❗',
}

function BugCard({ bug, index }) {
  const [open, setOpen] = useState(index < 2)
  const cfg = SEV_CONFIG[bug.severity] || SEV_CONFIG.medium

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms`, background: cfg.ring, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-center gap-3 p-3.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span className="text-lg shrink-0">{CAT_ICONS[bug.category] || '🐛'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100">{bug.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cfg.badge}>{bug.severity}</span>
            <span className="text-[10px] text-slate-500 font-mono">{bug.category.replace(/_/g, ' ')}</span>
            {bug.line_hint && <span className="text-[10px] text-slate-600 font-mono">line {bug.line_hint}</span>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />}
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in">
          <p className="text-sm text-slate-300 leading-relaxed">{bug.description}</p>
        </div>
      )}
    </div>
  )
}

export default function BugPredictionsPanel({ bug_predictions }) {
  const bugs = bug_predictions || []
  const critCount = bugs.filter(b => b.severity === 'critical').length
  const highCount = bugs.filter(b => b.severity === 'high').length
  const sorted = [...bugs].sort((a, b) => {
    const o = { critical: 0, high: 1, medium: 2, low: 3 }
    return (o[a.severity] ?? 4) - (o[b.severity] ?? 4)
  })

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-slate-200">{bugs.length} bugs predicted</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {critCount > 0 && <span className="badge-critical">{critCount} critical</span>}
          {highCount > 0 && <span className="badge-high">{highCount} high</span>}
          {bugs.filter(b => b.severity === 'medium').length > 0 && (
            <span className="badge-medium">{bugs.filter(b => b.severity === 'medium').length} medium</span>
          )}
          {bugs.filter(b => b.severity === 'low').length > 0 && (
            <span className="badge-low">{bugs.filter(b => b.severity === 'low').length} low</span>
          )}
        </div>
        {critCount === 0 && highCount === 0 && bugs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-green-400 ml-auto">
            <ShieldOff className="w-3.5 h-3.5" /> No critical issues
          </div>
        )}
      </div>

      {bugs.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <Cpu className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">No bugs predicted</p>
          <p className="text-xs text-slate-600 mt-1">Code appears structurally sound</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((bug, i) => <BugCard key={bug.id} bug={bug} index={i} />)}
        </div>
      )}
    </div>
  )
}

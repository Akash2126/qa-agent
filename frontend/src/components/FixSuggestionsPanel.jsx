import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Wrench, Zap, Clock, TrendingUp } from 'lucide-react'

function copyText(t) { navigator.clipboard.writeText(t).catch(() => {}) }

const EFFORT_CONFIG = {
  quick:       { badge: 'badge-quick',       icon: Zap,        label: 'Quick fix' },
  moderate:    { badge: 'badge-moderate',    icon: Clock,      label: 'Moderate' },
  significant: { badge: 'badge-significant', icon: TrendingUp, label: 'Significant' },
}
const IMPACT_CONFIG = {
  high:   { bar: 'from-red-500 to-rose-400',   w: 'w-full',   label: 'High impact' },
  medium: { bar: 'from-amber-500 to-yellow-400', w: 'w-2/3',  label: 'Medium impact' },
  low:    { bar: 'from-green-500 to-emerald-400', w: 'w-1/3', label: 'Low impact' },
}

function FixCard({ fix, index }) {
  const [open,   setOpen]   = useState(index < 2)
  const [copied, setCopied] = useState(false)
  const effort = EFFORT_CONFIG[fix.effort] || EFFORT_CONFIG.moderate
  const impact = IMPACT_CONFIG[fix.impact] || IMPACT_CONFIG.medium
  const EIcon  = effort.icon

  const handleCopy = (e) => {
    e.stopPropagation()
    copyText(fix.code_snippet)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card overflow-hidden transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}>

      {/* Header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
          style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <Wrench className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-0.5 font-mono truncate">fixes → {fix.bug_title}</p>
          <p className="text-sm font-semibold text-slate-100">{fix.fix_title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={effort.badge}>
              <EIcon className="w-2.5 h-2.5" />{effort.label}
            </span>
            <span className="text-xs text-slate-600">{impact.label}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1 bg-white/6 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${impact.bar} ${impact.w}`} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {open ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-white/5 animate-fade-in">
          {/* Explanation */}
          <div className="px-4 py-3">
            <p className="text-sm text-slate-400 leading-relaxed">{fix.explanation}</p>
          </div>

          {/* Code snippet */}
          {fix.code_snippet && (
            <div className="mx-4 mb-4">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5"
                  style={{ background: 'rgba(6,182,212,0.04)' }}>
                  <span className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-widest">Fix Code</span>
                  <button onClick={handleCopy}
                    className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-lg transition-all
                      ${copied ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                    {copied
                      ? <><Check className="w-3 h-3" strokeWidth={3} />Copied</>
                      : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-cyan-200 leading-relaxed overflow-x-auto"
                  style={{ background: '#060d1f' }}>
                  <code>{fix.code_snippet}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FixSuggestionsPanel({ fix_suggestions }) {
  const fixes = fix_suggestions || []

  const quickCount = fixes.filter(f => f.effort === 'quick').length
  const totalImpact = fixes.filter(f => f.impact === 'high').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="card p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">{fixes.length} fix suggestions</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {quickCount > 0 && (
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-green-400" />{quickCount} quick wins</span>
          )}
          {totalImpact > 0 && (
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-red-400" />{totalImpact} high impact</span>
          )}
        </div>
      </div>

      {fixes.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
            <Wrench className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No fixes generated</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {fixes.map((fix, i) => <FixCard key={fix.id} fix={fix} index={i} />)}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react'

function copyText(t) { navigator.clipboard.writeText(t).catch(() => {}) }

function TestCard({ tc, index }) {
  const [copied,   setCopied]   = useState(false)
  const [expanded, setExpanded] = useState(index < 3)

  const handleCopy = () => {
    copyText(`// ${tc.name}\n// ${tc.description}\n// Input: ${tc.input}\n// Expected: ${tc.expected_output}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const priorityStyle = { high:'text-red-400', medium:'text-amber-400', low:'text-green-400' }

  return (
    <div className={`card border transition-all duration-200 overflow-hidden animate-fade-up`}
      style={{ animationDelay: `${index * 40}ms` }}>

      {/* Header — always visible */}
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-slate-400"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 font-mono truncate">{tc.name}</p>
          {!expanded && <p className="text-xs text-slate-500 mt-0.5 truncate">{tc.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge-${tc.category}`}>{tc.category}</span>
          <span className={`text-xs font-semibold ${priorityStyle[tc.priority] || 'text-slate-400'}`}>
            {tc.priority}
          </span>
          <button onClick={e => { e.stopPropagation(); handleCopy() }}
            className={`p-1.5 rounded-lg transition-all ${copied ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
            {copied ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-white/5 pt-3">
          <p className="text-sm text-slate-400 leading-relaxed">{tc.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(6,182,212,0.12)' }}>
              <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-white/5"
                style={{ background: 'rgba(6,182,212,0.06)' }}>
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Input</span>
              </div>
              <div className="p-3"><code className="text-xs font-mono text-cyan-300 break-all">{tc.input}</code></div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.12)' }}>
              <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-white/5"
                style={{ background: 'rgba(34,197,94,0.06)' }}>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Expected</span>
              </div>
              <div className="p-3"><code className="text-xs font-mono text-green-300 break-all">{tc.expected_output}</code></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TestCasesPanel({ test_cases }) {
  const [filter, setFilter] = useState('all')
  const cats = ['all', 'unit', 'integration', 'functional']
  const filtered = filter === 'all' ? test_cases : test_cases.filter(t => t.category === filter)
  const counts   = cats.reduce((acc, c) => ({ ...acc, [c]: c === 'all' ? test_cases.length : test_cases.filter(t => t.category === c).length }), {})

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === c ? 'text-cyan-400 bg-cyan-500/12 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            {c} <span className="opacity-50 ml-1">{counts[c]}</span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-slate-400">{filtered.length} test case{filtered.length !== 1 ? 's' : ''}</span>
        {filter !== 'all' && <span className="text-slate-700">— filtered to {filter}</span>}
      </div>

      <div className="space-y-2">
        {filtered.map((tc, i) => <TestCard key={tc.id} tc={tc} index={i} />)}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-sm">No {filter} tests found.</div>
        )}
      </div>
    </div>
  )
}

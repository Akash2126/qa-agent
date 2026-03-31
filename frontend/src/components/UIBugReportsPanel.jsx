import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Eye, Link } from 'lucide-react'

export default function UIBugReportsPanel({ ui_bugs = [], ui_analysis = {} }) {
  const [expanded, setExpanded] = useState({})
  const [hovered, setHovered] = useState({})

  const getSeverityColor = (severity) => {
    return {
      critical: 'text-red-400 bg-red-500/10 border-red-500/20 ring-red-500/20',
      high: 'text-orange-400 bg-orange-500/10 border-orange-500/20 ring-orange-500/20',
      medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20 ring-amber-500/20',
      low: 'text-slate-400 bg-slate-800/50 border-slate-700/50 ring-slate-700/20'
    }[severity] || 'text-slate-400'
  }

  if (!ui_bugs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Eye className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="font-semibold text-lg text-slate-200 mb-2">No UI issues detected</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Good news! No obvious UI bugs found in the analysis.
          {ui_analysis.url && (
            <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
              <span className="text-xs text-slate-400 block mb-1">Analyzed:</span>
              <div className="flex items-center gap-2 text-sm text-cyan-400 truncate">
                <Link className="w-3 h-3" />
                <span className="truncate">{ui_analysis.url}</span>
              </div>
            </div>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
          <div>
            <h3 className="font-semibold text-slate-100 text-base">UI Issues Found</h3>
            <span className="text-xs text-slate-500">{ui_bugs.length} potential bugs</span>
          </div>
        </div>
        {ui_analysis.url && (
          <a href={ui_analysis.url} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/20 transition-all">
            <Link className="w-3 h-3" />
            View Page
          </a>
        )}
      </div>

      {ui_bugs.map((bug, index) => (
        <div 
          key={bug.id} 
          className={`group card overflow-hidden transition-all duration-200 animate-fade-up hover:shadow-2xl relative
            ${getSeverityColor(bug.severity).replace('text-', 'border-')}
            ring-1 ring-transparent hover:ring-current/20`}
          style={{ animationDelay: `${index * 50}ms` }}
          onMouseEnter={() => setHovered({ [bug.id]: true })}
          onMouseLeave={() => setHovered({ [bug.id]: false })}
        >
          {/* Header */}
          <div className="p-4 flex items-start gap-3 hover:bg-red-500/5">
            <div className={`flex-shrink-0 w-2 h-2 mt-1 rounded-full ${getSeverityColor(bug.severity).split(' ')[0]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs bg-slate-900 px-2 py-0.5 rounded-full text-slate-400">
                  {bug.id}
                </span>
                <span className={`px-2 py-px text-xs font-semibold rounded-full ${getSeverityColor(bug.severity)}`}>
                  {bug.severity?.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 capitalize">{bug.category}</span>
              </div>
              <h4 className="font-semibold text-slate-50 text-base leading-tight mb-1.5 truncate">{bug.title}</h4>
              {hovered[bug.id] && (
                <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">{bug.description || bug.actual}</p>
              )}
            </div>
            <button 
              onClick={() => setExpanded(e => ({ ...e, [bug.id]: !e[bug.id] }))}
              className={`p-1.5 rounded-lg transition-all text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 ${
                expanded[bug.id] ? 'bg-red-500/10 text-red-400' : ''
              }`}
            >
              {expanded[bug.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Details */}
          {expanded[bug.id] && (
            <div className="px-4 pb-4 pt-0 border-t border-slate-800/50">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 opacity-75" />
                    Steps to Reproduce
                  </h5>
                  <ol className="text-slate-300 space-y-1 list-decimal list-inside text-xs">
                    {bug.repro_steps?.map((step, i) => (
                      <li key={i} className="pl-1">{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h5 className="font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    Expected vs Actual
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-emerald-300 block mb-1">Expected:</strong>
                        <div className="text-emerald-200">{bug.expected}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <strong className="text-red-300 block mb-1">Actual:</strong>
                        <div className="text-red-200">{bug.actual}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

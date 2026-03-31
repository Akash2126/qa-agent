import { useState } from 'react'
import { Clipboard, ChevronDown, ChevronUp, Play } from 'lucide-react'

export default function FunctionalTestsPanel({ functional_tests = [], ui_analysis = {} }) {
  const [expanded, setExpanded] = useState({})
  const [copied, setCopied] = useState({})

  const toggleExpanded = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const handleCopy = async (steps) => {
    await navigator.clipboard.writeText(steps.join('\\n'))
    setCopied({ [steps.join('')]: true })
    setTimeout(() => setCopied({}), 2000)
  }

  if (!functional_tests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <Play className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="font-semibold text-lg text-slate-200 mb-2">No functional tests</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          UI analysis complete. {functional_tests.length ? '' : 'Try URL or screenshot input for functional tests.'}
          {ui_analysis.url && <span className="block mt-2 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full">URL: {ui_analysis.url}</span>}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-emerald-400">UI Flow Tests</span>
          <span className="text-xs text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-full">
            {functional_tests.length} test{functional_tests.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      
      {functional_tests.map((test, index) => (
        <div key={test.id} className="card border transition-all duration-200 overflow-hidden animate-fade-up"
          style={{ animationDelay: `${index * 40}ms`, borderColor: 'rgba(34,197,94,0.2)' }}>
          
          <div className="p-4 pb-3 flex items-start gap-3 hover:bg-emerald-500/5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {test.id}
                </span>
                <span className="text-emerald-50 font-medium text-sm capitalize">{test.category}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  test.priority === 'high' ? 'text-orange-400 bg-orange-500/10' : 
                  test.priority === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500'
                }`}>
                  {test.priority}
                </span>
              </div>
              <h4 className="font-semibold text-slate-100 text-base leading-tight mb-2">{test.title}</h4>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={e => { e.stopPropagation(); handleCopy(test.steps) }}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-slate-500 hover:text-emerald-400"
                title="Copy steps"
              >
                {copied[test.steps.join('')] ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <Clipboard className="w-3.5 h-3.5" />
                )}
              </button>
              <button 
                onClick={() => toggleExpanded(test.id)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-200"
              >
                {expanded[test.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded[test.id] && (
            <div className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                <div className="text-xs text-emerald-400 font-mono bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/20">
                  <strong>Expected:</strong> {test.expected_result}
                </div>
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3">
                  <div className="font-mono text-xs text-slate-300 leading-relaxed space-y-1">
                    {test.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 pl-2">
                        <span className="text-emerald-400 font-mono w-5 text-right opacity-75">{i+1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
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

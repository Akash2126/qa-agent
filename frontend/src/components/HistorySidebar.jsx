import { useState, useEffect } from 'react'
import { qaService } from '../services/api'
import { History, Trash2, FileCode, Loader2, Bug, ChevronRight, RefreshCw } from 'lucide-react'

const LANG_COLORS = {
  python:'from-blue-500 to-cyan-500', javascript:'from-yellow-400 to-amber-500',
  typescript:'from-blue-400 to-blue-600', java:'from-orange-500 to-red-500',
  go:'from-teal-400 to-cyan-500', rust:'from-orange-600 to-amber-600',
}

export default function HistorySidebar({ onSelect, activeId }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await qaService.history()
      setItems(data.items); setTotal(data.total)
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this run?')) return
    try {
      await qaService.deleterun(id)
      setItems(p => p.filter(i => i.id !== id))
      setTotal(t => t - 1)
    } catch { }
  }

  const scoreColor = s => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
  const langGrad   = l => LANG_COLORS[l] || 'from-slate-500 to-slate-400'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">History</span>
          {total > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/6 text-slate-400">{total}</span>
          )}
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
              <FileCode className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-xs font-medium text-slate-500">No runs yet</p>
            <p className="text-xs text-slate-700 mt-1">Generate your first analysis</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} onClick={() => onSelect(item.id)}
              className={`group relative rounded-xl p-3 cursor-pointer border transition-all duration-200
                ${activeId === item.id
                  ? 'bg-cyan-500/8 border-cyan-500/20'
                  : 'border-transparent hover:bg-white/4 hover:border-white/6'}`}>

              {/* Language dot + title */}
              <div className="flex items-start gap-2.5 mb-2">
                <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 bg-gradient-to-r ${langGrad(item.language)}`} />
                <p className="text-xs font-semibold text-slate-200 leading-tight line-clamp-2 flex-1">{item.title}</p>
                <button onClick={e => handleDelete(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap ml-4.5">
                <span className="text-[10px] font-mono text-slate-500 capitalize">{item.language}</span>
                <span className="text-slate-700">·</span>
                <span className={`text-[10px] font-bold font-mono ${scoreColor(item.coverage_score)}`}>
                  {item.coverage_score.toFixed(0)}%
                </span>
                {item.bug_count > 0 && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-red-400/80">
                      <Bug className="w-2.5 h-2.5" />{item.bug_count}
                    </span>
                  </>
                )}
                <span className="text-slate-700">·</span>
                <span className="text-[10px] text-slate-600">
                  {new Date(item.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {activeId === item.id && (
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-500" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

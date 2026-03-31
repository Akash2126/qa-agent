import { useState } from 'react'
import { githubService } from '../services/api'
import { Github, X, Search, FileCode, Loader2, AlertCircle, ChevronRight, FolderOpen } from 'lucide-react'

const EXT_LANG = { py:'python', js:'javascript', ts:'typescript', jsx:'javascript', tsx:'typescript', java:'java', go:'go', rb:'ruby', rs:'rust', cs:'csharp', cpp:'cpp', kt:'kotlin' }

export default function GitHubImport({ onImport, onClose }) {
  const [url,      setUrl]      = useState('')
  const [files,    setFiles]    = useState([])
  const [repo,     setRepo]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(null)
  const [error,    setError]    = useState('')

  const langFromPath = p => EXT_LANG[p.split('.').pop()] || 'python'

  const fetchRepo = async () => {
    if (!url.trim()) return
    setError(''); setLoading(true); setFiles([])
    try {
      const { data } = await githubService.listFiles(url.trim())
      setFiles(data.files); setRepo({ owner: data.owner, name: data.repo })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not fetch repo. Ensure it is public.')
    } finally { setLoading(false) }
  }

  const selectFile = async (path) => {
    if (!repo) return
    setFetching(path)
    try {
      const { data } = await githubService.getFile(repo.owner, repo.name, path)
      onImport({ code: data.content, language: langFromPath(path), title: `${repo.owner}/${repo.name} — ${path.split('/').pop()}` })
      onClose()
    } catch { setError('Failed to load file content.') }
    finally { setFetching(null) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/8 shadow-2xl animate-fade-up overflow-hidden"
        style={{ background: 'rgba(9,13,28,0.98)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/6">
              <Github className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Import from GitHub</h2>
              <p className="text-xs text-slate-500">Public repositories only</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/6 text-slate-500 hover:text-slate-300 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* URL input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Repository URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchRepo()}
                className="input flex-1"
              />
              <button onClick={fetchRepo} disabled={loading || !url.trim()} className="btn-primary shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Fetch
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <p className="text-xs text-slate-400">
                  <span className="text-cyan-400 font-mono">{repo?.owner}/{repo?.name}</span>
                  {' '}— {files.length} code files
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-white/6 divide-y divide-white/4"
                style={{ background: '#060d1f' }}>
                {files.map(f => (
                  <button key={f.path} onClick={() => selectFile(f.path)} disabled={!!fetching}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/4 transition-colors group disabled:opacity-50">
                    {fetching === f.path
                      ? <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      : <FileCode className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
                    }
                    <span className="text-xs font-mono text-slate-400 group-hover:text-slate-200 truncate flex-1 transition-colors">{f.path}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700 opacity-0 group-hover:opacity-100 shrink-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

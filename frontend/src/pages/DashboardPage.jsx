import { useState, useCallback, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import Navbar           from '../components/Navbar'
import HistorySidebar   from '../components/HistorySidebar'
import TestCasesPanel        from '../components/TestCasesPanel'
import EdgeCasesPanel        from '../components/EdgeCasesPanel'
import BugPredictionsPanel   from '../components/BugPredictionsPanel'
import FixSuggestionsPanel   from '../components/FixSuggestionsPanel'
import FunctionalTestsPanel  from '../components/FunctionalTestsPanel'
import UIBugReportsPanel     from '../components/UIBugReportsPanel'
import CoveragePanel    from '../components/CoveragePanel'
import ExplanationPanel from '../components/ExplanationPanel'
import StepLoader       from '../components/StepLoader'
import GitHubImport     from '../components/GitHubImport'
import { qaService }    from '../services/api'
import { exportJSON, exportPDF } from '../services/exportUtils'
import { useDebounce }  from '../hooks/useDebounce'
import {
  Play, Download, Github, PanelLeft, FileJson, FileText,
  Zap, AlertCircle, ChevronDown, X, Wand2, Code2, FileCode2, Bug, Wrench,
  Globe, Image
} from 'lucide-react'

const LANGUAGES = ['python','javascript','typescript','java','go','ruby','rust','csharp','cpp','kotlin']

const TABS = [
  { id:'test_cases',        label:'Code Tests',    icon: FileCode2, countKey:'test_cases' },
  { id:'functional_tests',  label:'UI Tests',      icon: Play,      countKey:'functional_tests' },
  { id:'edge_cases',        label:'Edge Cases',    icon: Zap,       countKey:'edge_cases' },
  { id:'bug_predictions',   label:'Bugs',          icon: Bug,       countKey:'bug_predictions' },
  { id:'fix_suggestions',   label:'Fixes',         icon: Wrench,    countKey:'fix_suggestions' },
  { id:'coverage',          label:'Coverage',      icon: null,      countKey:null },
  { id:'explanation',       label:'Summary',       icon: null,      countKey:null },
]

const EDITOR_OPTS = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: '"JetBrains Mono", monospace',
  fontLigatures: true,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line',
  padding: { top: 16, bottom: 16 },
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  bracketPairColorization: { enabled: true },
}

const PLACEHOLDER = `# Paste your code or describe requirements
# Tip: Ctrl/Cmd + Enter to run analysis

def calculate_discount(price, discount_percent, user_type="regular"):
    """Calculate final price after discount."""
    if price < 0:
        raise ValueError("Price cannot be negative")
    if not 0 <= discount_percent <= 100:
        raise ValueError("Discount must be 0-100")

    multiplier = 0.9 if user_type == "premium" else 1.0
    discount = price * (discount_percent / 100) * multiplier
    return round(price - discount, 2)
`

export default function DashboardPage() {
  const [code,        setCode]        = useState(PLACEHOLDER)
  const [language,    setLanguage]    = useState('python')
  const [inputMode,   setInputMode]   = useState('code')  // code | url | screenshot
  const [urlInput,    setUrlInput]    = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [inputType,   setInputType]   = useState('code')
  const [activeTab,   setActiveTab]   = useState('test_cases')
  const [result,      setResult]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [loadStep,    setLoadStep]    = useState(1)
  const [error,       setError]       = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyId,   setHistoryId]   = useState(null)
  const [showGH,      setShowGH]      = useState(false)
  const [autoRun,     setAutoRun]     = useState(false)
  const [mobileView,  setMobileView]  = useState('editor')

  const debouncedCode = useDebounce(code, 2200)
  const ranRef        = useRef(false)
  const stepTimer     = useRef(null)

  // ── Simulate step-by-step loader progression ───────────────────────────────
  const startStepAnimation = () => {
    setLoadStep(1)
    let step = 1
    stepTimer.current = setInterval(() => {
      step = Math.min(step + 1, 7)
      setLoadStep(step)
    }, 1400)
  }
  const stopStepAnimation = () => {
    if (stepTimer.current) { clearInterval(stepTimer.current); stepTimer.current = null }
  }

  // ── Auto-run on paste ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRun || !debouncedCode || debouncedCode === PLACEHOLDER || ranRef.current) return
    handleGenerate()
  }, [debouncedCode, autoRun])

  useEffect(() => () => stopStepAnimation(), [])

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setScreenshotFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = useCallback(async () => {
    if (loading) return
    setError(''); setLoading(true); setResult(null)
    setActiveTab('test_cases'); setMobileView('output')
    ranRef.current = true
    startStepAnimation()
    try {
      const payload = {
        input_type: inputType,
        language,
        code: inputMode === 'code' ? code : '',
      }
      if (inputMode === 'code') {
        if (!code.trim()) return setError('Enter code first')
      } else if (inputMode === 'url') {
        if (!urlInput.trim()) return setError('Enter URL first')
        payload.url = urlInput
        payload.input_type = 'url'
      } else if (inputMode === 'screenshot') {
        if (!screenshotFile) return setError('Upload screenshot first')
        const reader = new FileReader()
        reader.onload = async () => {
          payload.screenshot_b64 = reader.result.split(',')[1]  // base64 without prefix
          const { data } = await qaService.generate(payload)
          setResult(data); setHistoryId(null)
          stopStepAnimation(); setLoading(false)
        }
        reader.readAsDataURL(screenshotFile)
        return  // async file read
      }
      const { data } = await qaService.generate(payload)
      setResult(data); setHistoryId(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      stopStepAnimation(); setLoading(false)
      setTimeout(() => { ranRef.current = false }, 5000)
    }
  }, [code, urlInput, screenshotFile, language, inputType, inputMode, loading])

  // ── Load history run ───────────────────────────────────────────────────────
  const handleHistorySelect = async (id) => {
    setHistoryId(id); setLoading(true); setError('')
    setMobileView('output'); startStepAnimation()
    try {
      const { data } = await qaService.getrun(id)
      setResult(data); setCode(data.input_code); setLanguage(data.language)
      setActiveTab('test_cases')
    } catch { setError('Could not load this run.') }
    finally { stopStepAnimation(); setLoading(false) }
  }

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate() } }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [handleGenerate])

  // ── Tab count badges ───────────────────────────────────────────────────────
  const getCount = (key) => {
    if (!result || !key) return null
    const val = result[key]
    return Array.isArray(val) ? val.length : null
  }

  const getBugBadgeColor = () => {
    if (!result?.bug_predictions?.length) return ''
    const hasCrit = result.bug_predictions.some(b => b.severity === 'critical')
    const hasHigh = result.bug_predictions.some(b => b.severity === 'high')
    if (hasCrit) return 'text-red-400'
    if (hasHigh) return 'text-amber-400'
    return 'text-yellow-400'
  }

  // ── Render output ──────────────────────────────────────────────────────────
  const renderOutput = () => {
    if (loading) return <StepLoader currentStep={loadStep} />

    if (error) return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-semibold text-red-400 mb-1">Analysis Failed</p>
        <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        <button onClick={() => setError('')} className="btn-ghost mt-4 text-xs">
          <X className="w-3.5 h-3.5" /> Dismiss
        </button>
      </div>
    )

    if (!result) return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        {/* Animated placeholder orb */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full opacity-20 animate-spin-slow"
            style={{ background: 'conic-gradient(from 0deg, #06b6d4, #7c3aed, #06b6d4)', filter: 'blur(8px)' }} />
          <div className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Wand2 className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <h3 className="font-display font-semibold text-lg text-slate-200 mb-2">Ready to analyze</h3>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
          Paste your code in the editor and run the 7-step AI pipeline to get test cases, bug predictions, and more.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <kbd className="px-2 py-1 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>⌘</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>Enter</kbd>
          <span className="text-slate-700">to run instantly</span>
        </div>
      </div>
    )

    return (
      <div className="flex flex-col h-full">
        {/* Output tabs */}
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-px">
            {TABS.map(tab => {
              const count = getCount(tab.countKey)
              const isBug = tab.id === 'bug_predictions'
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`tab shrink-0 flex items-center gap-1.5 ${activeTab === tab.id ? 'active' : ''}`}>
                  {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  {count !== null && (
                    <span className={`text-[10px] font-bold tabular-nums ${activeTab !== tab.id ? (isBug ? getBugBadgeColor() : 'text-slate-600') : 'opacity-70'}`}>
                      {count}
                    </span>
                  )}
                  {tab.id === 'coverage' && result.coverage_score != null && (
                    <span className={`text-[10px] font-bold ${activeTab !== tab.id ? (result.coverage_score >= 80 ? 'text-green-400/70' : result.coverage_score >= 60 ? 'text-amber-400/70' : 'text-red-400/70') : 'opacity-70'}`}>
                      {result.coverage_score.toFixed(0)}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="border-b border-white/5 mt-2" />
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4 animate-fade-in">
          {activeTab === 'test_cases'     && <TestCasesPanel      test_cases={result.test_cases} />}
          {activeTab === 'functional_tests' && <FunctionalTestsPanel functional_tests={result.functional_tests || []} ui_analysis={result.ui_analysis || {}} />}
          {activeTab === 'edge_cases'     && <EdgeCasesPanel      edge_cases={result.edge_cases} />}
{activeTab === 'ui_bugs' ? <UIBugReportsPanel ui_bugs={result.bug_predictions.filter(b => b.category === 'ui' || b.repro_steps)} ui_analysis={result.ui_analysis} /> : 
  activeTab === 'bug_predictions'&& <BugPredictionsPanel bug_predictions={result.bug_predictions.filter(b => !b.category || b.category !== 'ui')} />}
          {activeTab === 'fix_suggestions'&& <FixSuggestionsPanel fix_suggestions={result.fix_suggestions} />}
          {activeTab === 'coverage'       && <CoveragePanel coverage_score={result.coverage_score} coverage_breakdown={result.coverage_breakdown} improvements={result.improvements} />}
          {activeTab === 'explanation'    && <ExplanationPanel {...result} />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#030712' }}>
      <Navbar />

      {/* Mobile view switcher */}
      <div className="md:hidden flex border-b border-white/5 shrink-0"
        style={{ background: 'rgba(6,13,31,0.9)' }}>
        {['editor','output'].map(v => (
          <button key={v} onClick={() => setMobileView(v)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${mobileView === v ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600 border-b-2 border-transparent'}`}>
            {v === 'editor' ? '< Editor >' : '⚡ Output'}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">

        {/* ── History sidebar ─────────────────────────────────────────────── */}
        <aside className={`hidden md:flex flex-col shrink-0 border-r border-white/5 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-0'}`}
          style={{ background: 'rgba(6,13,31,0.6)' }}>
          {sidebarOpen && <HistorySidebar onSelect={handleHistorySelect} activeId={historyId} />}
        </aside>

        {/* ── Editor pane ─────────────────────────────────────────────────── */}
        <div className={`flex flex-col border-r border-white/5 overflow-hidden transition-all duration-200
          ${mobileView === 'output' ? 'hidden md:flex' : 'flex'} w-full md:w-1/2`}>

          {/* Editor toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 shrink-0"
            style={{ background: 'rgba(6,13,31,0.8)' }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              className="hidden md:flex btn-ghost p-1.5 rounded-xl" title="Toggle history">
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Language selector */}
            <div className="relative">
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="appearance-none text-xs bg-white/4 border border-white/8 text-slate-300 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:border-cyan-500/30 cursor-pointer capitalize">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 pointer-events-none" />
            </div>

            {/* Input Mode Tabs */}
            <div className="flex rounded-lg overflow-hidden border border-white/8">
              {['code','url','screenshot'].map(mode => (
                <button key={mode} onClick={() => { setInputMode(mode); setInputType(mode === 'code' ? 'code' : 'requirement') }}
                  className={`px-2.5 py-1 text-xs font-medium capitalize transition-all ${inputMode === mode ? 'bg-cyan-500/15 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>
                  {mode === 'code' ? <><Code2 className="w-3 h-3 inline mr-1" />Code</> : 
                   mode === 'url' ? <><Globe className="w-3 h-3 inline mr-1" />URL</> :
                   <><Image className="w-3 h-3 inline mr-1" />Screenshot</>}
                </button>
              ))}
            </div>

            {/* Code Type Toggle (code mode only) */}
            {inputMode === 'code' && (
              <div className="flex rounded-lg overflow-hidden border border-white/8 ml-2">
                {['code','requirement'].map(t => (
                  <button key={t} onClick={() => setInputType(t)}
                    className={`px-2 py-1 text-xs font-medium capitalize transition-all ${inputType === t ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>
                    {t === 'code' ? 'Code' : 'Reqs'}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1" />

            {/* Auto-run toggle */}
            <button onClick={() => setAutoRun(o => !o)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border ${autoRun ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-slate-600 bg-transparent border-white/6 hover:border-white/10'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${autoRun ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              Auto
            </button>

            {/* GitHub import */}
            <button onClick={() => setShowGH(true)} className="btn-ghost p-1.5 rounded-xl" title="Import from GitHub">
              <Github className="w-4 h-4" />
            </button>
          </div>

          {/* Input Content - conditional */}
          <div className="flex-1 overflow-hidden">
            {inputMode === 'code' && (
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={v => setCode(v || '')}
                theme="vs-dark"
                options={EDITOR_OPTS}
              />
            )}
            {inputMode === 'url' && (
              <div className="h-full flex flex-col p-4">
                <input 
                  type="url" 
                  placeholder="https://example.com"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="input flex-1 resize-none"
                />
              </div>
            )}
            {inputMode === 'screenshot' && (
              <div className="h-full flex flex-col p-4 gap-3">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="file-input"
                />
                {screenshotPreview && (
                  <img src={screenshotPreview} alt="Screenshot preview" className="max-h-64 object-contain rounded-lg border border-white/10 mx-auto" />
                )}
              </div>
            )}
          </div>

          {/* Run bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 shrink-0"
            style={{ background: 'rgba(6,13,31,0.9)' }}>
            <span className="text-xs text-slate-700 hidden sm:block font-mono">⌘ + Enter</span>
            <div className="flex-1" />
            {result && (
              <div className="flex items-center gap-1">
                <button onClick={() => exportJSON(result)} className="btn-ghost text-xs py-1.5 px-2.5 rounded-lg gap-1.5">
                  <FileJson className="w-3.5 h-3.5" />JSON
                </button>
                <button onClick={() => exportPDF(result)} className="btn-ghost text-xs py-1.5 px-2.5 rounded-lg gap-1.5">
                  <FileText className="w-3.5 h-3.5" />PDF
                </button>
              </div>
            )}
            <button onClick={handleGenerate} disabled={loading}
              className="btn-primary py-2 text-sm">
              <Play className="w-3.5 h-3.5" />
              {loading ? 'Analyzing…' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {/* ── Output pane ─────────────────────────────────────────────────── */}
        <div className={`flex flex-col w-full md:w-1/2 overflow-hidden
          ${mobileView === 'editor' ? 'hidden md:flex' : 'flex'}`}>

          {/* Output toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0"
            style={{ background: 'rgba(6,13,31,0.8)' }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))' }}>
                <Zap className="w-3 h-3 text-cyan-300" />
              </div>
              <span className="text-xs font-semibold text-slate-400">AI Output</span>
              {result && (
                <span className="text-xs text-slate-700">· run #{result.run_id}</span>
              )}
            </div>
            {result && (
              <div className="flex items-center gap-1">
                <button onClick={() => exportJSON(result)} className="btn-ghost text-xs py-1 px-2 gap-1">
                  <FileJson className="w-3 h-3" />JSON
                </button>
                <button onClick={() => exportPDF(result)} className="btn-ghost text-xs py-1 px-2 gap-1">
                  <FileText className="w-3 h-3" />PDF
                </button>
              </div>
            )}
          </div>

          {/* Output content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderOutput()}
          </div>
        </div>
      </div>

      {showGH && (
        <GitHubImport
          onImport={({ code: c, language: l, title: t }) => { setCode(c); setLanguage(l); setShowGH(false) }}
          onClose={() => setShowGH(false)}
        />
      )}
    </div>
  )
}

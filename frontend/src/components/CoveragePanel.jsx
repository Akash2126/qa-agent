import { Shield, TrendingUp, Award } from 'lucide-react'

const BREAKDOWN_LABELS = {
  function_coverage:       'Functions',
  branch_coverage:         'Branches',
  error_handling_coverage: 'Error Handling',
  edge_case_coverage:      'Edge Cases',
  integration_coverage:    'Integration',
}

function RingGauge({ score }) {
  const r    = 52
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(score / 100, 1)
  const grade= score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
  const color= score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const glow = score >= 80 ? 'rgba(34,197,94,0.35)' : score >= 60 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        {/* Progress */}
        <circle cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 10px ${glow})` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold font-mono text-white">{score.toFixed(0)}<span className="text-base text-slate-400">%</span></div>
        <div className="text-sm font-bold font-display mt-0.5" style={{ color }}>Grade {grade}</div>
      </div>
    </div>
  )
}

function BarRow({ label, value }) {
  const color = value >= 80 ? 'from-green-500 to-emerald-400' : value >= 60 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-rose-400'
  const textColor = value >= 80 ? 'text-green-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={`text-xs font-bold font-mono ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${value}%`, boxShadow: value >= 80 ? '0 0 8px rgba(34,197,94,0.4)' : 'none' }}
        />
      </div>
    </div>
  )
}

export default function CoveragePanel({ coverage_score, coverage_breakdown, improvements }) {
  const score = coverage_score || 0

  const gradeLabel = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : score >= 60 ? 'Needs Work' : 'Poor'
  const gradeDesc  = score >= 80
    ? 'Test suite provides solid protection against regressions.'
    : score >= 60
    ? 'Coverage is partial. Gaps exist in critical paths.'
    : 'Significant coverage gaps. High regression risk.'

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Score card */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Coverage Score</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="flex flex-col items-center">
            <RingGauge score={score} />
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-slate-200">{gradeLabel}</p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-[140px] text-center leading-relaxed">{gradeDesc}</p>
            </div>
          </div>
          <div className="flex-1 w-full space-y-3.5">
            {Object.entries(coverage_breakdown || {}).map(([key, val]) => (
              <BarRow key={key} label={BREAKDOWN_LABELS[key] || key} value={val} />
            ))}
          </div>
        </div>
      </div>

      {/* Improvements */}
      {improvements?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recommended Improvements</h3>
          </div>
          <div className="space-y-3">
            {improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)' }}>
                  {i + 1}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{imp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement badge for high scores */}
      {score >= 85 && (
        <div className="rounded-xl p-4 flex items-center gap-3 animate-bounce-sm"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <Award className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">High Coverage Achieved!</p>
            <p className="text-xs text-slate-400 mt-0.5">Your test suite meets production quality standards.</p>
          </div>
        </div>
      )}
    </div>
  )
}

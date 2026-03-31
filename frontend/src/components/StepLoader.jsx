import { Check, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Analyzing code structure',   sub: 'Detecting functions, classes & patterns' },
  { id: 2, label: 'Generating test cases',       sub: 'Creating unit, integration & functional tests' },
  { id: 3, label: 'Detecting edge cases',        sub: 'Finding boundary conditions & failure points' },
  { id: 4, label: 'Predicting bugs',             sub: 'Static analysis for common vulnerabilities' },
  { id: 5, label: 'Generating fix suggestions',  sub: 'Building actionable code remediation' },
  { id: 6, label: 'Evaluating coverage',         sub: 'Calculating weighted coverage score' },
  { id: 7, label: 'Building report',             sub: 'Compiling analysis & improvement plan' },
]

export default function StepLoader({ currentStep = 1 }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      {/* Animated orb */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)', animation: 'spin 4s linear infinite' }} />
        <div className="absolute inset-2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', animation: 'spin 3s linear infinite reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(6,182,212,0.3)' }}>
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          </div>
        </div>
      </div>

      <h3 className="font-display font-semibold text-white text-lg mb-1">Running AI Pipeline</h3>
      <p className="text-slate-500 text-sm mb-10">7-step agentic analysis in progress…</p>

      {/* Steps list */}
      <div className="w-full max-w-sm space-y-1">
        {STEPS.map((step, i) => {
          const isDone    = step.id < currentStep
          const isActive  = step.id === currentStep
          const isPending = step.id > currentStep

          return (
            <div key={step.id}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300
                ${isActive ? 'bg-cyan-500/8 border border-cyan-500/15' : 'border border-transparent'}`}
              style={{ animationDelay: `${i * 50}ms` }}>

              {/* Status icon */}
              <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                {isDone    && <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-green-400" strokeWidth={3} /></div>}
                {isActive  && <div className="step-dot-active" />}
                {isPending && <div className="step-dot-idle" />}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors ${isDone ? 'text-slate-400' : isActive ? 'text-slate-100' : 'text-slate-600'}`}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-cyan-500/70 mt-0.5 animate-fade-in">{step.sub}</p>
                )}
              </div>

              {/* Step number */}
              <span className={`text-xs font-mono shrink-0 ${isActive ? 'text-cyan-500' : isDone ? 'text-green-500/60' : 'text-white/10'}`}>
                {String(step.id).padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

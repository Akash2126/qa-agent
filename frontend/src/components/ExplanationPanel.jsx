import { BookOpen, Cpu, GitBranch, Bug, FlaskConical, Clock } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-4 flex flex-col gap-2 animate-fade-up">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-slate-100">{value}</p>
        <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function ExplanationPanel({ explanation, test_cases, edge_cases, bug_predictions, fix_suggestions, functional_tests, coverage_score, language, generated_at, ui_analysis }) {
  const highPriority    = test_cases?.filter(t => t.priority === 'high').length || 0
  const critBugs        = bug_predictions?.filter(b => b.severity === 'critical').length || 0
  const quickFixes      = fix_suggestions?.filter(f => f.effort === 'quick').length || 0
  const uiTests         = functional_tests?.length || 0
  const genTime         = generated_at ? new Date(generated_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : 'N/A'

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard icon={FlaskConical} label="Code Tests"    value={test_cases?.length || 0}      sub={`${highPriority} high`}           color="bg-cyan-500/10 text-cyan-400" />
        <StatCard icon={Play}         label="UI Tests"       value={uiTests}                      sub="functional flows"                 color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={GitBranch}    label="Edge Cases"     value={edge_cases?.length || 0}      sub="boundaries"                       color="bg-violet-500/10 text-violet-400" />
        <StatCard icon={Bug}          label="Bugs Found"     value={bug_predictions?.length || 0} sub={critBugs > 0 ? `${critBugs} crit` : 'none crit'} color="bg-red-500/10 text-red-400" />
        <StatCard icon={Cpu}          label="Quick Fixes"    value={quickFixes}                   sub="ready now"                        color="bg-green-500/10 text-green-400" />
      </div>

      {/* AI explanation */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Analysis Summary</h3>
        </div>
        {explanation ? (
          <p className="text-sm text-slate-300 leading-7">{explanation}</p>
        ) : (
          <p className="text-sm text-slate-500 italic">No explanation generated for this run.</p>
        )}
      </div>

      {/* Run metadata */}
      <div className="card p-4">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Run Metadata</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Language',       value: language || 'N/A' },
            { label: 'Coverage Score', value: `${coverage_score?.toFixed(1) || 0}%` },
            { label: 'Tests Generated',value: `${test_cases?.length || 0} cases` },
            { label: 'Bugs Predicted', value: `${bug_predictions?.length || 0} issues` },
            { label: 'Fixes Suggested',value: `${fix_suggestions?.length || 0} suggestions` },
            { label: 'Generated At',   value: genTime },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-600">{label}</p>
              <p className="text-sm font-semibold text-slate-200 font-mono mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

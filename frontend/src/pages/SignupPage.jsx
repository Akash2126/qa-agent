import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

const PERKS = ['10 AI analyses per day, free forever', 'Full bug prediction & fix suggestions', 'Coverage scoring & history', 'GitHub repo import']

function StrengthBar({ password }) {
  const len = password.length
  if (!len) return null
  const levels = [
    { min: 1,  max: 5,  label: 'Too short', width: 'w-1/4', color: 'bg-red-500' },
    { min: 6,  max: 9,  label: 'Weak',      width: 'w-2/4', color: 'bg-amber-500' },
    { min: 10, max: 13, label: 'Good',       width: 'w-3/4', color: 'bg-yellow-400' },
    { min: 14, max: Infinity, label: 'Strong', width: 'w-full', color: 'bg-green-500' },
  ]
  const level = levels.find(l => len >= l.min && len <= l.max) || levels[0]
  return (
    <div className="mt-2">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className={`h-full rounded-full transition-all duration-300 ${level.color} ${level.width}`} />
      </div>
      <p className="text-xs text-slate-600 mt-1">{level.label}</p>
    </div>
  )
}

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate   = useNavigate()
  const [form,    setForm]    = useState({ email: '', username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await signup(form.email, form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#030712' }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #060d1f 0%, #0d1528 50%, #070f2b 100%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(139,92,246,0.08)' }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(6,182,212,0.06)' }} />

        <div className="flex items-center gap-3 relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-white text-xl">QA Agent</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="font-display font-bold text-4xl text-white leading-tight mb-3">
              Start testing<br /><span className="glow-text-violet">smarter today.</span>
            </h1>
            <p className="text-slate-400 leading-relaxed">Join developers who ship with confidence using AI-powered QA automation.</p>
          </div>
          <div className="space-y-3">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-sm text-slate-300">{p}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-700 relative">No credit card required · Cancel anytime</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">QA Agent</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-white mb-1">Create your account</h2>
            <p className="text-slate-400 text-sm">Free forever · No credit card needed</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl mb-5 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="text" required minLength={3} placeholder="yourhandle"
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="email" required placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="password" required minLength={6} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-10" />
              </div>
              <StrengthBar password={form.password} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2 py-3">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</span>
              ) : (
                <span className="flex items-center gap-2">Create free account <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

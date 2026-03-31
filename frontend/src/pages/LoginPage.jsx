import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, AlertCircle, ArrowRight, Github, Sparkles } from 'lucide-react'

const FEATURES = [
  { icon: '⚡', text: 'AI-powered test generation in seconds' },
  { icon: '🔍', text: 'Predict bugs before they hit production' },
  { icon: '📊', text: 'Visual coverage scoring & breakdown' },
  { icon: '🔧', text: 'Actionable code fix suggestions' },
]

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#030712' }}>

      {/* Left — Feature panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #060d1f 0%, #0a1528 50%, #07102b 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(6,182,212,0.07)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(139,92,246,0.07)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)', boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-white text-xl">QA Agent</span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <h1 className="font-display font-bold text-4xl text-white leading-tight mb-3">
              Ship code with<br />
              <span className="glow-text-cyan">confidence.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              AI-powered test automation that thinks like a senior QA engineer.
            </p>
          </div>
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="text-lg">{f.icon}</span>
                <p className="text-sm text-slate-300">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-700 relative">© 2025 QA Agent · AI-Powered Testing</p>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">QA Agent</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl mb-5 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                <input type="password" required placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2 py-3">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</span>
              ) : (
                <span className="flex items-center gap-2">Sign in <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/6 text-center">
            <p className="text-sm text-slate-500">
              No account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-slate-700 mt-6">
            Free plan includes 10 AI analyses per day
          </p>
        </div>
      </div>
    </div>
  )
}

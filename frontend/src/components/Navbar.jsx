import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { qaService } from '../services/api'
import { Zap, LayoutDashboard, Settings, LogOut, ChevronDown, Crown, Sparkles } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [usage, setUsage]     = useState(null)
  const [open, setOpen]       = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    qaService.usage().then(r => setUsage(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pct      = usage ? Math.round((usage.used / usage.limit) * 100) : 0
  const barColor = pct > 85 ? 'from-red-500 to-rose-400' : pct > 60 ? 'from-amber-500 to-yellow-400' : 'from-cyan-500 to-violet-500'
  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)', boxShadow: '0 0 16px rgba(6,182,212,0.35)' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-700 text-white text-[15px] tracking-tight hidden sm:block">QA Agent</span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
            v2
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Link to="/dashboard" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isActive('/dashboard') ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <Link to="/settings" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${isActive('/settings') ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Settings className="w-3.5 h-3.5" /> Settings
          </Link>
        </nav>

        <div className="flex-1" />

        {/* Usage meter */}
        {usage && (
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <span className="text-xs text-slate-500">{usage.used}/{usage.limit} requests</span>
                {usage.plan === 'pro' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <Crown className="w-2.5 h-2.5" /> PRO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }}>
                    FREE
                  </span>
                )}
              </div>
              <div className="w-36 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-white/6 hover:border-cyan-500/20 hover:bg-white/3 transition-all duration-200">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white font-display"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #7c3aed)' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-none">{user?.username}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{user?.plan || 'free'} plan</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/8 shadow-2xl overflow-hidden animate-fade-in"
              style={{ background: 'rgba(9,13,28,0.98)', backdropFilter: 'blur(20px)' }}>
              <div className="px-4 py-3 border-b border-white/6">
                <p className="text-sm font-semibold text-slate-100">{user?.username}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button onClick={() => { navigate('/dashboard'); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-all">
                  <LayoutDashboard className="w-4 h-4 text-slate-500" /> Dashboard
                </button>
                <button onClick={() => { navigate('/settings'); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-all">
                  <Settings className="w-4 h-4 text-slate-500" /> Settings
                </button>
                <div className="my-1 border-t border-white/6" />
                <button onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/8 transition-all">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

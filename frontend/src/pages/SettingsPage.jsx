import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { qaService } from '../services/api'
import Navbar from '../components/Navbar'
import {
  User, Mail, Lock, Crown, BarChart2, Calendar, FlaskConical,
  ArrowLeft, Save, CheckCircle2, AlertCircle, Loader2, Shield
} from 'lucide-react'

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold font-mono text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState({ type: '', text: '' })

  const [profileForm, setProfileForm] = useState({ username: '' })
  const [pwForm,      setPwForm]      = useState({ current_password: '', new_password: '', confirm: '' })

  useEffect(() => {
    qaService.settings()
      .then(r => { setSettings(r.data); setProfileForm({ username: r.data.username }) })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load settings.' }))
      .finally(() => setLoading(false))
  }, [])

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await qaService.updateSettings({ username: profileForm.username })
      setSettings(data); showMsg('success', 'Username updated successfully.')
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Failed to update profile.')
    } finally { setSaving(false) }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) { showMsg('error', 'Passwords do not match.'); return }
    if (pwForm.new_password.length < 6) { showMsg('error', 'Password must be at least 6 characters.'); return }
    setSaving(true)
    try {
      await qaService.updateSettings({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
      showMsg('success', 'Password changed successfully.')
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Failed to change password.')
    } finally { setSaving(false) }
  }

  const usagePct = settings ? Math.round((settings.usage_today / settings.usage_limit) * 100) : 0
  const barColor = usagePct > 85 ? 'from-red-500 to-rose-400' : usagePct > 60 ? 'from-amber-500 to-yellow-400' : 'from-cyan-500 to-violet-500'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Back + heading */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
          </div>
        </div>

        {/* Toast */}
        {msg.text && (
          <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 animate-fade-up ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
            style={{ background: msg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p className="text-sm">{msg.text}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up">

            {/* Usage stats */}
            {settings && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile icon={FlaskConical} label="Total Runs"    value={settings.total_runs}  color="bg-cyan-500/10 text-cyan-400" />
                <StatTile icon={BarChart2}    label="Used Today"    value={settings.usage_today} color="bg-violet-500/10 text-violet-400" />
                <StatTile icon={Shield}       label="Daily Limit"   value={settings.usage_limit} color="bg-amber-500/10 text-amber-400" />
                <StatTile icon={Calendar}     label="Member Since"  value={settings.member_since} color="bg-green-500/10 text-green-400" />
              </div>
            )}

            {/* Plan card */}
            {settings && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className={`w-4 h-4 ${settings.plan === 'pro' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <h2 className="text-sm font-semibold text-slate-200">Current Plan</h2>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${settings.plan === 'pro' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-white/6 text-slate-400 border border-white/8'}`}>
                    {settings.plan}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Daily usage</span>
                    <span className="text-slate-300 font-mono">{settings.usage_today} / {settings.usage_limit}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                      style={{ width: `${usagePct}%` }} />
                  </div>
                  <p className="text-xs text-slate-600">{settings.usage_limit - settings.usage_today} requests remaining today</p>
                </div>
                {settings.plan === 'free' && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Upgrade for 500 requests/day</p>
                    <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Upgrade to Pro →</button>
                  </div>
                )}
              </div>
            )}

            {/* Profile section */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <User className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200">Profile</h2>
              </div>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="text" required minLength={3} value={profileForm.username}
                        onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))}
                        className="input pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="email" disabled value={settings?.email || ''} className="input pl-10 opacity-50 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Profile</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Password section */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200">Change Password</h2>
              </div>
              <form onSubmit={savePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Current Password</label>
                  <input type="password" required placeholder="Current password"
                    value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    className="input" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">New Password</label>
                    <input type="password" required minLength={6} placeholder="Min. 6 characters"
                      value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Confirm Password</label>
                    <input type="password" required placeholder="Repeat new password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                      className={`input ${pwForm.confirm && pwForm.confirm !== pwForm.new_password ? 'border-red-500/40' : ''}`} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Lock className="w-4 h-4" />Change Password</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger zone */}
            <div className="card p-5 border-red-500/10">
              <h2 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Sign out of all sessions</p>
                  <p className="text-xs text-slate-600 mt-0.5">You will be returned to the login page</p>
                </div>
                <button onClick={logout} className="btn-danger border border-red-500/20">Sign out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

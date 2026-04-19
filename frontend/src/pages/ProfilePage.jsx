import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfile } from '../store/slices/authSlice'
import api from '../api/axios'
import { User, Bell, Shield, Download, Activity } from 'lucide-react'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const [form, setForm] = useState({
    name: user?.name || '',
    financialProfile: { salary: '', monthlyExpenses: '', financialGoals: '', ...user?.financialProfile },
    preferences: { emailNotifications: true, reminderDays: 3, darkMode: true, ...user?.preferences }
  })
  const [notifications, setNotifications] = useState([])
  const [sessions, setSessions] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (tab === 'notifications') api.get('/notifications').then(r => setNotifications(r.data.data.notifications)).catch(() => {})
    if (tab === 'security') {
      api.get('/users/sessions').then(r => setSessions(r.data.data.sessions)).catch(() => {})
      api.get('/users/activity-log').then(r => setActivityLog(r.data.data.logs)).catch(() => {})
    }
  }, [tab])

  const set = (path, val) => {
    const keys = path.split('.')
    if (keys.length === 1) setForm({ ...form, [keys[0]]: val })
    else setForm({ ...form, [keys[0]]: { ...form[keys[0]], [keys[1]]: val } })
  }

  const handleSave = (e) => {
    e.preventDefault()
    dispatch(updateProfile(form))
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const downloadReport = async () => {
    const res = await api.get('/users/export-report')
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'debt-report.json'; a.click()
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <button onClick={downloadReport} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={14}/> Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 p-1 rounded-xl w-fit border border-slate-700/50">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Personal Info</h2>
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Financial Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Salary (₹)</label>
                <input className="input" type="number" value={form.financialProfile.salary}
                  onChange={(e) => set('financialProfile.salary', Number(e.target.value))} placeholder="50000" />
              </div>
              <div>
                <label className="label">Monthly Expenses (₹)</label>
                <input className="input" type="number" value={form.financialProfile.monthlyExpenses}
                  onChange={(e) => set('financialProfile.monthlyExpenses', Number(e.target.value))} placeholder="20000" />
              </div>
            </div>
            <div>
              <label className="label">Financial Goals</label>
              <textarea className="input resize-none h-20" value={form.financialProfile.financialGoals}
                onChange={(e) => set('financialProfile.financialGoals', e.target.value)}
                placeholder="e.g. Become debt-free by 2027, save for home…" />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Preferences</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Email Notifications</p>
                <p className="text-slate-500 text-xs">Receive EMI reminders and payment alerts</p>
              </div>
              <button type="button" onClick={() => set('preferences.emailNotifications', !form.preferences.emailNotifications)}
                className={`w-11 h-6 rounded-full transition-all ${form.preferences.emailNotifications ? 'bg-primary-600' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${form.preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div>
              <label className="label">Reminder Days Before Due</label>
              <select className="input" value={form.preferences.reminderDays}
                onChange={(e) => set('preferences.reminderDays', Number(e.target.value))}>
                {[1,2,3,5,7,14].map(d => <option key={d} value={d} className="bg-surface-900">{d} day{d>1?'s':''} before</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">Save Changes</button>
        </form>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="max-w-xl space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm">{notifications.filter(n=>!n.isRead).length} unread</p>
            <button onClick={markAllRead} className="text-primary-400 text-sm hover:text-primary-300">Mark all read</button>
          </div>
          {notifications.length === 0 ? (
            <div className="card text-center py-10 text-slate-500">No notifications</div>
          ) : (
            <div className="card divide-y divide-slate-700/50">
              {notifications.map((n) => (
                <div key={n._id} className={`py-3 flex gap-3 ${!n.isRead ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-primary-400' : 'bg-transparent'}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{n.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{n.message}</p>
                    <p className="text-slate-600 text-xs mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="max-w-xl space-y-4">
          <div className="card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Activity size={15}/>Active Sessions</h2>
            {sessions.map((s, i) => (
              <div key={i} className="py-3 border-b border-slate-700/50 last:border-0">
                <p className="text-white text-sm font-medium truncate">{s.deviceInfo?.slice(0,60)}…</p>
                <p className="text-slate-500 text-xs mt-0.5">IP: {s.ipAddress} · {new Date(s.createdAt).toLocaleString('en-IN')}</p>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-slate-500 text-sm">No active sessions</p>}
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-4">Recent Activity</h2>
            {activityLog.slice(0,10).map((log, i) => (
              <div key={i} className="py-2.5 border-b border-slate-700/50 last:border-0 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm capitalize">{log.action}</p>
                  <p className="text-slate-500 text-xs">{log.ipAddress}</p>
                </div>
                <p className="text-slate-600 text-xs">{new Date(log.timestamp).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

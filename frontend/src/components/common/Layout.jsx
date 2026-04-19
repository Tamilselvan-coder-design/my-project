import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, CreditCard, Wallet, Building2,
  Bot, MessageSquare, User, LogOut, Menu, X, Bell, TrendingDown
} from 'lucide-react'
import { logout } from '../../store/slices/authSlice'
import api from '../../api/axios'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/loans', icon: CreditCard, label: 'Loans' },
  { to: '/payments', icon: Wallet, label: 'Payments' },
  { to: '/bank', icon: Building2, label: 'Bank Accounts' },
  { to: '/advisor', icon: TrendingDown, label: 'AI Advisor' },
  { to: '/chatbot', icon: MessageSquare, label: 'AI Chatbot' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications?unread=true').then(r => setUnread(r.data.data.unreadCount)).catch(() => {})
  }, [])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 bg-surface-950 border-r border-slate-800 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-lg flex-shrink-0">💰</div>
          {sidebarOpen && <span className="font-bold text-white text-sm leading-tight">Smart Debt<br/><span className="text-primary-400">Manager</span></span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-2 border-t border-slate-800">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-surface-950 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition" onClick={() => navigate('/profile')}>
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

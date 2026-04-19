import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../store/slices/loanSlice'
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { CreditCard, TrendingDown, CheckCircle, AlertCircle, Plus, ArrowRight } from 'lucide-react'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#22c55e','#06b6d4']

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white mt-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export default function DashboardPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dashboard, loading } = useSelector((s) => s.loans)
  const { user } = useSelector((s) => s.auth)

  useEffect(() => { dispatch(fetchDashboard()) }, [dispatch])

  const stats = dashboard?.stats || {}
  const loans = dashboard?.loans || []
  const emiTrend = dashboard?.emiTrend || []
  const loanDist = Object.entries(dashboard?.loanDistribution || {}).map(([name, value]) => ({ name, value }))

  const debtFreeProgress = stats.totalPaid && (stats.totalPaid + stats.totalDebt) > 0
    ? Math.round((stats.totalPaid / (stats.totalPaid + stats.totalDebt)) * 100) : 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-0.5">Here's your financial overview</p>
        </div>
        <button onClick={() => navigate('/loans')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Loan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Debt" value={fmt(stats.totalDebt)} icon={TrendingDown} color="bg-red-500/20 text-red-400" sub={`${stats.activeLoans || 0} active loans`} />
        <StatCard label="Monthly EMI" value={fmt(stats.monthlyEMI)} icon={CreditCard} color="bg-primary-600/20 text-primary-400" sub="Due this month" />
        <StatCard label="Total Paid" value={fmt(stats.totalPaid)} icon={CheckCircle} color="bg-green-500/20 text-green-400" sub="All time" />
        <StatCard label="Overdue" value={stats.overdueLoans || 0} icon={AlertCircle} color="bg-amber-500/20 text-amber-400" sub="loans" />
      </div>

      {/* Debt-Free Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Debt-Free Progress</h3>
          <span className="text-primary-400 font-bold text-sm">{debtFreeProgress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div className="bg-gradient-to-r from-primary-600 to-violet-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${debtFreeProgress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Paid: {fmt(stats.totalPaid)}</span>
          <span>Remaining: {fmt(stats.totalDebt)}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* EMI Trend */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">EMI Trend (6 Months)</h3>
          {loading ? <div className="h-48 flex items-center justify-center text-slate-500">Loading…</div> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={emiTrend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(v) => [fmt(v), 'EMI']} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#emiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Loan Distribution */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Loan Distribution</h3>
          {loanDist.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
              <CreditCard size={32} className="opacity-30" />
              <p className="text-sm">No loans yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={loanDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {loanDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                    formatter={(v) => [fmt(v), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {loanDist.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-400 capitalize">{d.name.replace('_', ' ')}</span>
                    </div>
                    <span className="text-white font-medium">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Loans */}
      {loans.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Active Loans</h3>
            <button onClick={() => navigate('/loans')} className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {loans.slice(0, 4).map((loan) => (
              <div key={loan._id} className="flex items-center justify-between p-3 bg-surface-900 rounded-xl">
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm">{loan.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{loan.type.replace('_', ' ')} · {loan.interestRate}% p.a.</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-white font-semibold text-sm">{fmt(loan.remainingBalance)}</p>
                  <p className="text-xs text-slate-500">EMI: {fmt(loan.emi)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

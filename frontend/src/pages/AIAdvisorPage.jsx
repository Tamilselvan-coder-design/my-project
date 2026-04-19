import { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Sparkles, RefreshCw, TrendingUp, Shield, Target, Calendar } from 'lucide-react'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const CreditGauge = ({ score }) => {
  const pct = ((score - 300) / 600) * 100
  const color = score >= 750 ? '#22c55e' : score >= 700 ? '#84cc16' : score >= 650 ? '#eab308' : score >= 600 ? '#f97316' : '#ef4444'
  const label = score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : score >= 600 ? 'Poor' : 'Very Poor'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#334155" strokeWidth="10" strokeDasharray="226" strokeDashoffset="113" />
          <circle cx="60" cy="60" r="48" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray="226" strokeDashoffset={226 - (pct / 100) * 113} style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0 mt-4">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">Estimated Credit Score</p>
    </div>
  )
}

export default function AIAdvisorPage() {
  const { user } = useSelector((s) => s.auth)
  const [advice, setAdvice] = useState(null)
  const [creditScore, setCreditScore] = useState(null)
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)

  const getAdvice = async () => {
    setLoading(true)
    try {
      const res = await api.get('/ai/advice')
      setAdvice(res.data.data.advice)
      setCreditScore(res.data.data.creditScore)
      setContext(res.data.data.financialContext)
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI service unavailable. Check your OpenAI API key.')
    } finally { setLoading(false) }
  }

  // Simple markdown-ish renderer
  const renderAdvice = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <h3 key={i} className="font-bold text-white mt-4 mb-1">{line.replace(/\*\*/g, '')}</h3>
      if (line.startsWith('- '))
        return <li key={i} className="text-slate-300 text-sm ml-4 mb-0.5 list-disc">{line.slice(2)}</li>
      if (line.match(/^\d+\./))
        return <p key={i} className="text-slate-300 text-sm mb-1">{line}</p>
      if (line.trim() === '') return <div key={i} className="h-2" />
      return <p key={i} className="text-slate-300 text-sm">{line}</p>
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Financial Advisor</h1>
          <p className="text-slate-400 text-sm mt-0.5">Powered by GPT — personalized to your loans</p>
        </div>
        <button onClick={getAdvice} disabled={loading} className="btn-primary flex items-center gap-2">
          <Sparkles size={15}/>
          {loading ? 'Analyzing…' : advice ? 'Refresh Analysis' : 'Get AI Advice'}
        </button>
      </div>

      {!advice && !loading && (
        <div className="card flex flex-col items-center py-16 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-600/20 flex items-center justify-center">
            <Sparkles size={28} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Get Your Personalized Analysis</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-md">Our AI will analyze your salary, expenses, and loan portfolio to provide a tailored repayment strategy.</p>
          </div>
          <button onClick={getAdvice} className="btn-primary flex items-center gap-2 mt-2">
            <Sparkles size={15}/> Analyze My Finances
          </button>
        </div>
      )}

      {loading && (
        <div className="card flex flex-col items-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-slate-400">Analyzing your financial profile…</p>
        </div>
      )}

      {advice && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Advice Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary-400" />
                <h2 className="font-semibold text-white">AI Recommendation</h2>
              </div>
              <div className="prose-sm space-y-0.5">{renderAdvice(advice)}</div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Credit Score */}
            {creditScore && (
              <div className="card flex flex-col items-center py-6">
                <CreditGauge score={creditScore} />
              </div>
            )}

            {/* Financial Snapshot */}
            {context && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-white text-sm">Your Snapshot</h3>
                {[
                  { icon: TrendingUp, label: 'Monthly Income', value: fmt(context.salary), color: 'text-green-400' },
                  { icon: Target, label: 'Monthly EMI', value: fmt(context.monthlyEMI), color: 'text-red-400' },
                  { icon: Shield, label: 'Disposable Income', value: fmt(context.disposableIncome), color: context.disposableIncome > 0 ? 'text-green-400' : 'text-red-400' },
                  { icon: Calendar, label: 'DTI Ratio', value: `${context.dtiRatio}%`, color: Number(context.dtiRatio) < 30 ? 'text-green-400' : 'text-amber-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className="text-slate-500" />
                      <span className="text-slate-400 text-xs">{label}</span>
                    </div>
                    <span className={`font-semibold text-sm ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">AI advice is for informational purposes only. Consult a certified financial advisor for major decisions.</p>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/slices/authSlice'
import { Eye, EyeOff, TrendingDown } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    const result = await dispatch(login(form))
    if (result.meta.requestStatus === 'fulfilled') navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-2xl mx-auto mb-4 glow">💰</div>
          <h1 className="text-2xl font-bold text-white">Smart Debt Manager</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your financial dashboard</p>
        </div>

        <div className="card border-slate-700">
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">Secured with AES-256 encryption & JWT authentication</p>
      </div>
    </div>
  )
}

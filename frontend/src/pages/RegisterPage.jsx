import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../store/slices/authSlice'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((s) => s.auth)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    const result = await dispatch(register(form))
    if (result.meta.requestStatus === 'fulfilled') navigate('/dashboard')
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-2xl mx-auto mb-4 glow">💰</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Start managing your debt intelligently</p>
        </div>

        <div className="card border-slate-700">
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" placeholder="Arjun Sharma" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="arjun@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="Min 8 chars, uppercase, number, symbol"
                  value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Must include uppercase, lowercase, number & special character</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

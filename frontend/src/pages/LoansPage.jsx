import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLoans, createLoan, updateLoan, deleteLoan } from '../store/slices/loanSlice'
import { Plus, Edit2, Trash2, X, TrendingDown, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const LOAN_TYPES = ['personal','education','home','vehicle','credit_card','business','other']
const STATUS_COLORS = { active:'bg-green-500/20 text-green-400', closed:'bg-slate-500/20 text-slate-400', overdue:'bg-red-500/20 text-red-400', paused:'bg-amber-500/20 text-amber-400' }
const STATUS_ICONS = { active: CheckCircle, closed: CheckCircle, overdue: AlertTriangle, paused: Clock }

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const EMPTY = { name:'', type:'personal', lender:'', principal:'', interestRate:'', tenureMonths:'', startDate:'', dueDate:'', notes:'' }

export default function LoansPage() {
  const dispatch = useDispatch()
  const { items: loans, loading } = useSelector((s) => s.loans)
  const [modal, setModal] = useState(null) // null | 'create' | loan object
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState('all')

  useEffect(() => { dispatch(fetchLoans()) }, [dispatch])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (loan) => {
    setForm({ ...loan, startDate: loan.startDate?.split('T')[0] || '' })
    setModal(loan)
  }
  const closeModal = () => setModal(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = { ...form, principal: Number(form.principal), interestRate: Number(form.interestRate), tenureMonths: Number(form.tenureMonths), dueDate: Number(form.dueDate) }
    if (modal === 'create') {
      await dispatch(createLoan(data))
    } else {
      await dispatch(updateLoan({ id: modal._id, data }))
    }
    closeModal()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this loan? This cannot be undone.')) return
    dispatch(deleteLoan(id))
  }

  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter)

  const calcEMIPreview = () => {
    const p = Number(form.principal), r = Number(form.interestRate), t = Number(form.tenureMonths)
    if (!p || !t) return null
    if (r === 0) return (p / t).toFixed(0)
    const mr = r / 12 / 100
    return (p * mr * Math.pow(1+mr,t) / (Math.pow(1+mr,t)-1)).toFixed(0)
  }

  const emiPreview = calcEMIPreview()

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Loan Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{loans.length} total loans</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Loan
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all','active','overdue','closed','paused'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${filter===f ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Loans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">Loading loans…</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <TrendingDown size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No loans found</p>
          <p className="text-slate-600 text-sm mt-1">Add your first loan to get started</p>
          <button onClick={openCreate} className="btn-primary mt-4 flex items-center gap-2"><Plus size={15}/>Add Loan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((loan) => {
            const Icon = STATUS_ICONS[loan.status] || CheckCircle
            return (
              <div key={loan._id} className="card hover:border-slate-600 transition group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{loan.name}</h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{loan.type.replace('_',' ')} {loan.lender ? `· ${loan.lender}` : ''}</p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[loan.status]}`}>
                    <Icon size={10}/> {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-900 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Balance</p>
                    <p className="text-white font-bold text-sm mt-0.5">{fmt(loan.remainingBalance)}</p>
                  </div>
                  <div className="bg-surface-900 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Monthly EMI</p>
                    <p className="text-primary-400 font-bold text-sm mt-0.5">{fmt(loan.emi)}</p>
                  </div>
                  <div className="bg-surface-900 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Interest</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{loan.interestRate}% p.a.</p>
                  </div>
                  <div className="bg-surface-900 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Due Day</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{loan.dueDate}{['st','nd','rd'][loan.dueDate-1]||'th'} monthly</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>{loan.paidMonths}/{loan.tenureMonths} months paid</span>
                    <span>{loan.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-primary-600 to-violet-500 h-1.5 rounded-full"
                      style={{ width: `${loan.progressPercent}%` }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(loan)} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-2">
                    <Edit2 size={13}/> Edit
                  </button>
                  <button onClick={() => handleDelete(loan._id)} className="btn-danger flex items-center justify-center gap-1.5 text-sm py-2 px-3">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">{modal === 'create' ? 'Add New Loan' : 'Edit Loan'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Loan Name *</label>
                  <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. SBI Personal Loan" required />
                </div>
                <div>
                  <label className="label">Type *</label>
                  <select className="input" value={form.type} onChange={set('type')}>
                    {LOAN_TYPES.map(t => <option key={t} value={t} className="bg-surface-900 capitalize">{t.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Lender</label>
                  <input className="input" value={form.lender} onChange={set('lender')} placeholder="SBI, HDFC…" />
                </div>
                <div>
                  <label className="label">Principal Amount (₹) *</label>
                  <input className="input" type="number" value={form.principal} onChange={set('principal')} placeholder="500000" required />
                </div>
                <div>
                  <label className="label">Interest Rate (% p.a.) *</label>
                  <input className="input" type="number" step="0.01" value={form.interestRate} onChange={set('interestRate')} placeholder="10.5" required />
                </div>
                <div>
                  <label className="label">Tenure (months) *</label>
                  <input className="input" type="number" value={form.tenureMonths} onChange={set('tenureMonths')} placeholder="60" required />
                </div>
                <div>
                  <label className="label">EMI Due Day *</label>
                  <input className="input" type="number" min="1" max="31" value={form.dueDate} onChange={set('dueDate')} placeholder="5" required />
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" value={form.startDate} onChange={set('startDate')} required />
                </div>
                {emiPreview && (
                  <div className="bg-primary-600/10 border border-primary-600/20 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Calculated EMI</span>
                    <span className="font-bold text-primary-400">₹{Number(emiPreview).toLocaleString('en-IN')}/mo</span>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input resize-none h-20" value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{modal === 'create' ? 'Add Loan' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

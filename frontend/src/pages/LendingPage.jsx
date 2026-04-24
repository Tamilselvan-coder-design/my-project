import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLendings, createLending, recordPayment, deleteLending } from '../store/slices/lendingSlice'
import { Plus, Coins, ArrowDownLeft, ArrowUpRight, Trash2, DollarSign, Calendar, User, Percent } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const EMPTY = {
  borrowerEmail: '',
  amount: '',
  interestRate: '0',
  tenureMonths: '',
  purpose: '',
  notes: '',
  dueDate: '',
}

export default function LendingPage() {
  const dispatch = useDispatch()
  const { items: lendings, dashboard, loading } = useSelector((s) => s.lending)
  const [modal, setModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '' })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    dispatch(fetchLendings())
  }, [dispatch])

  const openCreate = () => {
    setForm(EMPTY)
    setModal('create')
  }

  const closeModal = () => {
    setModal(null)
    setForm(EMPTY)
  }

  const openPayment = (lending) => {
    setPaymentModal(lending)
    setPaymentForm({ amount: lending.emi, note: '' })
  }

  const closePaymentModal = () => {
    setPaymentModal(null)
    setPaymentForm({ amount: '', note: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      ...form,
      amount: Number(form.amount),
      interestRate: Number(form.interestRate),
      tenureMonths: Number(form.tenureMonths),
    }
    await dispatch(createLending(data))
    closeModal()
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    await dispatch(recordPayment({
      id: paymentModal._id,
      amount: Number(paymentForm.amount),
      note: paymentForm.note,
    }))
    closePaymentModal()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this lending? This cannot be undone.')) return
    dispatch(deleteLending(id))
  }

  const userId = useSelector((s) => s.auth.user?._id)

  const filtered = lendings.filter(l => {
    if (filter === 'all') return true
    if (filter === 'lent') return l.lender._id === userId || l.lender === userId
    if (filter === 'borrowed') return l.borrower._id === userId || l.borrower === userId
    return l.status === filter
  })

  const calcEMIPreview = () => {
    const p = Number(form.amount), r = Number(form.interestRate), t = Number(form.tenureMonths)
    if (!p || !t) return null
    if (r === 0) return (p / t).toFixed(0)
    const mr = r / 12 / 100
    return (p * mr * Math.pow(1 + mr, t) / (Math.pow(1 + mr, t) - 1)).toFixed(0)
  }

  const emiPreview = calcEMIPreview()

  const isLender = (l) => l.lender._id === userId || l.lender === userId

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <HandCoins className="text-amber-400" size={28} />
            P2P Lending
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Lend money or track your borrowings</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Plus size={16} /> Lend Money
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Lent</p>
              <p className="text-2xl font-bold text-amber-400">{fmt(dashboard?.totalLent)}</p>
            </div>
            <ArrowUpRight className="text-amber-400/50" size={32} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{dashboard?.lentCount || 0} lendings</p>
        </div>

        <div className="card border-l-4 border-l-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Borrowed</p>
              <p className="text-2xl font-bold text-red-400">{fmt(dashboard?.totalBorrowed)}</p>
            </div>
            <ArrowDownLeft className="text-red-400/50" size={32} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{dashboard?.borrowedCount || 0} borrowings</p>
        </div>

        <div className="card border-l-4 border-l-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Expected Returns</p>
              <p className="text-2xl font-bold text-green-400">{fmt(dashboard?.expectedReturns)}</p>
            </div>
            <DollarSign className="text-green-400/50" size={32} />
          </div>
          <p className="text-xs text-slate-500 mt-2">per month</p>
        </div>

        <div className="card border-l-4 border-l-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Monthly Repayment</p>
              <p className="text-2xl font-bold text-blue-400">{fmt(dashboard?.monthlyRepayment)}</p>
            </div>
            <Calendar className="text-blue-400/50" size={32} />
          </div>
          <p className="text-xs text-slate-500 mt-2">to pay</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'lent', 'borrowed', 'active', 'paid', 'overdue'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${
              filter === f
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lendings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <HandCoins size={48} className="text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">No lendings found</p>
          <p className="text-slate-600 text-sm mt-1">Lend money to someone or track your borrowings</p>
          <button onClick={openCreate} className="btn-primary mt-4 flex items-center gap-2">
            <Plus size={15} /> Lend Money
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lending) => {
            const amILender = isLender(lending)
            return (
              <div key={lending._id} className="card hover:border-amber-500/30 transition group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${amILender ? 'bg-amber-400' : 'bg-red-400'}`} />
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${amILender ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                      {amILender ? <ArrowUpRight className="text-amber-400" size={20} /> : <ArrowDownLeft className="text-red-400" size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{amILender ? 'Lent to' : 'Borrowed from'}</p>
                      <p className="text-sm text-slate-400">{amILender ? lending.borrower?.name || 'Borrower' : lending.lender?.name || 'Lender'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lending.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    lending.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                    lending.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {lending.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Amount</span>
                    <span className="text-white font-semibold">{fmt(lending.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Remaining</span>
                    <span className="text-amber-400 font-semibold">{fmt(lending.remainingBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">EMI</span>
                    <span className="text-white">{fmt(lending.emi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Interest</span>
                    <span className="text-slate-300">{lending.interestRate}%</span>
                  </div>
                </div>

                {lending.purpose && (
                  <p className="text-xs text-slate-500 mb-3 truncate">{lending.purpose}</p>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                  {!amILender && lending.status === 'active' && (
                    <button
                      onClick={() => openPayment(lending)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                    >
                      <DollarSign size={14} /> Pay EMI
                    </button>
                  )}
                  {amILender && (
                    <button
                      onClick={() => handleDelete(lending._id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HandCoins className="text-amber-400" size={24} />
                Lend Money
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Borrower Email *</label>
                <input
                  type="email"
                  value={form.borrowerEmail}
                  onChange={(e) => setForm({ ...form, borrowerEmail: e.target.value })}
                  className="input-field"
                  placeholder="borrower@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field"
                    placeholder="50000"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tenure (months) *</label>
                  <input
                    type="number"
                    value={form.tenureMonths}
                    onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })}
                    className="input-field"
                    placeholder="12"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    value={form.interestRate}
                    onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                    className="input-field"
                    placeholder="0"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Purpose</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="input-field"
                  placeholder="What is this for?"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              {emiPreview && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400">Monthly EMI: <span className="font-bold">{fmt(emiPreview)}</span></p>
                </div>
              )}

              <button type="submit" className="w-full btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-3">
                Create Lending
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="text-green-400" size={24} />
                Record Payment
              </h2>
              <button onClick={closePaymentModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-3 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-400">Borrowed from: <span className="text-white">{paymentModal.lender?.name || 'Lender'}</span></p>
                <p className="text-sm text-slate-400">Remaining: <span className="text-amber-400">{fmt(paymentModal.remainingBalance)}</span></p>
                <p className="text-sm text-slate-400">Monthly EMI: <span className="text-white">{fmt(paymentModal.emi)}</span></p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="input-field"
                  min="1"
                  max={paymentModal.remainingBalance}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Note</label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="input-field"
                  placeholder="Payment note..."
                />
              </div>

              <button type="submit" className="w-full btn-primary bg-green-600 hover:bg-green-700 py-3">
                Record Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
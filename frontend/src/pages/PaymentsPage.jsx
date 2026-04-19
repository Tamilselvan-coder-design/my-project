import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLoans } from '../store/slices/loanSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const STATUS_STYLE = { success:'text-green-400', failed:'text-red-400', pending:'text-amber-400', refunded:'text-blue-400' }
const STATUS_ICON = { success: CheckCircle, failed: XCircle, pending: Clock, refunded: RefreshCw }

export default function PaymentsPage() {
  const dispatch = useDispatch()
  const { items: loans } = useSelector((s) => s.loans)
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [paying, setPaying] = useState(null)
  const [selectedLoan, setSelectedLoan] = useState('')

  useEffect(() => {
    dispatch(fetchLoans())
    loadTransactions()
  }, [dispatch])

  const loadTransactions = async () => {
    try {
      const res = await api.get('/payments/transactions')
      setTransactions(res.data.data.transactions)
    } catch { toast.error('Failed to load transactions') }
    finally { setTxLoading(false) }
  }

  const handlePay = async (loan) => {
    if (!window.Razorpay) {
      toast.error('Razorpay not loaded. Add Razorpay script to index.html.')
      return
    }
    setPaying(loan._id)
    try {
      const res = await api.post('/payments/order', { loanId: loan._id, amount: loan.emi })
      const { order, key, loanName, amount } = res.data.data

      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'Smart Debt Manager',
        description: `EMI Payment - ${loanName}`,
        order_id: order.id,
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              loanId: loan._id,
            })
            toast.success('Payment successful! 🎉')
            loadTransactions()
            dispatch(fetchLoans())
          } catch { toast.error('Payment verification failed') }
        },
        modal: { ondismiss: () => toast('Payment cancelled', { icon: 'ℹ️' }) }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => toast.error('Payment failed'))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally { setPaying(null) }
  }

  const activeLoans = loans.filter(l => l.status === 'active')

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-slate-400 text-sm mt-0.5">Pay EMIs securely via Razorpay</p>
      </div>

      {/* Pay EMI Section */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Pay EMI</h2>
        {activeLoans.length === 0 ? (
          <p className="text-slate-500 text-sm">No active loans to pay.</p>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((loan) => (
              <div key={loan._id} className="flex items-center justify-between p-4 bg-surface-900 rounded-xl">
                <div>
                  <p className="font-medium text-white">{loan.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{loan.type.replace('_',' ')} · Due on {loan.dueDate}th</p>
                  {loan.status === 'overdue' && (
                    <span className="text-xs text-red-400 font-medium">⚠️ Overdue</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-bold">{fmt(loan.emi)}</p>
                    <p className="text-xs text-slate-500">per month</p>
                  </div>
                  <button onClick={() => handlePay(loan)} disabled={paying === loan._id}
                    className="btn-primary flex items-center gap-2 text-sm py-2">
                    <CreditCard size={14}/>
                    {paying === loan._id ? 'Processing…' : 'Pay Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Transaction History</h2>
          <button onClick={loadTransactions} className="text-slate-400 hover:text-white transition"><RefreshCw size={15}/></button>
        </div>

        {txLoading ? (
          <p className="text-slate-500 text-sm py-4 text-center">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-0 divide-y divide-slate-700/50">
            {transactions.map((tx) => {
              const Icon = STATUS_ICON[tx.status] || Clock
              return (
                <div key={tx._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.status === 'success' ? 'bg-green-500/20' : tx.status === 'failed' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                      <Icon size={14} className={STATUS_STYLE[tx.status]} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.description || `EMI Payment`}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.status === 'success' ? 'text-green-400' : tx.status === 'failed' ? 'text-red-400' : 'text-white'}`}>
                      {fmt(tx.amount)}
                    </p>
                    <p className={`text-xs capitalize ${STATUS_STYLE[tx.status]}`}>{tx.status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Razorpay script note */}
      <p className="text-xs text-slate-600 text-center">
        Payments powered by Razorpay test mode · Add <code className="text-slate-500">&lt;script src="https://checkout.razorpay.com/v1/checkout.js"&gt;</code> to index.html
      </p>
    </div>
  )
}

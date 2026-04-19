import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Building2, Plus, RefreshCw, Trash2, X, CreditCard, TrendingUp, TrendingDown } from 'lucide-react'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const BANKS = ['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra','Punjab National Bank','Bank of Baroda','Yes Bank','IndusInd Bank','Other']

const EMPTY = { bankName: '', accountNumber: '', accountType: 'savings', ifscCode: '', balance: '50000' }

export default function BankPage() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [syncing, setSyncing] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [accRes, txRes] = await Promise.all([api.get('/bank'), api.get('/bank/transactions')])
      setAccounts(accRes.data.data.accounts)
      setTransactions(txRes.data.data.transactions)
    } catch { toast.error('Failed to load bank data') }
    finally { setLoading(false) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/bank', { ...form, balance: Number(form.balance) })
      setAccounts([...accounts, res.data.data.account])
      setModal(false); setForm(EMPTY)
      toast.success('Bank account linked!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to link account') }
  }

  const handleSync = async (id) => {
    setSyncing(id)
    try {
      const res = await api.put(`/bank/${id}/sync`)
      toast.success(`Synced! ${res.data.data.newTransactions} new transactions`)
      loadData()
    } catch { toast.error('Sync failed') }
    finally { setSyncing(null) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this bank account?')) return
    await api.delete(`/bank/${id}`)
    setAccounts(accounts.filter(a => a._id !== id))
    toast.success('Account removed')
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bank Accounts</h1>
          <p className="text-slate-400 text-sm mt-0.5">Total Balance: <span className="text-green-400 font-semibold">{fmt(totalBalance)}</span></p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={15}/>Link Account</button>
      </div>

      {/* Accounts */}
      {loading ? (
        <p className="text-slate-400 text-center py-10">Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-4">
          <Building2 size={40} className="text-slate-600" />
          <p className="text-slate-400">No bank accounts linked yet</p>
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={15}/>Link Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <Building2 size={18} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{acc.bankName}</p>
                    <p className="text-xs text-slate-500 font-mono">{acc.accountNumber}</p>
                  </div>
                </div>
                <span className="badge bg-slate-700/50 text-slate-400 capitalize">{acc.accountType}</span>
              </div>
              <div className="bg-surface-900 rounded-xl p-3 mb-4">
                <p className="text-xs text-slate-500">Available Balance</p>
                <p className="text-xl font-bold text-green-400 mt-0.5">{fmt(acc.balance)}</p>
              </div>
              <p className="text-xs text-slate-600 mb-3">Last synced: {acc.lastSynced ? new Date(acc.lastSynced).toLocaleString('en-IN') : 'Never'}</p>
              <div className="flex gap-2">
                <button onClick={() => handleSync(acc._id)} disabled={syncing === acc._id}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-2">
                  <RefreshCw size={13} className={syncing === acc._id ? 'animate-spin' : ''}/> Sync
                </button>
                <button onClick={() => handleDelete(acc._id)} className="btn-danger px-3">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions */}
      {transactions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Recent Transactions</h2>
          <div className="divide-y divide-slate-700/50">
            {transactions.slice(0, 20).map((tx, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {tx.type === 'credit' ? <TrendingUp size={13} className="text-green-400"/> : <TrendingDown size={13} className="text-red-400"/>}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{tx.description}</p>
                    <p className="text-xs text-slate-500">{tx.bankName} · {new Date(tx.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 rounded-2xl border border-slate-700 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="font-bold text-white">Link Bank Account</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="label">Bank Name *</label>
                <select className="input" value={form.bankName} onChange={set('bankName')} required>
                  <option value="">Select bank…</option>
                  {BANKS.map(b => <option key={b} value={b} className="bg-surface-900">{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Account Number *</label>
                <input className="input font-mono" value={form.accountNumber} onChange={set('accountNumber')} placeholder="1234 5678 9012" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Account Type</label>
                  <select className="input" value={form.accountType} onChange={set('accountType')}>
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>
                <div>
                  <label className="label">Starting Balance (₹)</label>
                  <input className="input" type="number" value={form.balance} onChange={set('balance')} />
                </div>
              </div>
              <div>
                <label className="label">IFSC Code</label>
                <input className="input font-mono" value={form.ifscCode} onChange={set('ifscCode')} placeholder="SBIN0001234" />
              </div>
              <p className="text-xs text-slate-500">This is a mock connection for demonstration. No real bank credentials are stored.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Link Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

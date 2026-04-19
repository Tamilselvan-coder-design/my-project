import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import api from './api/axios'
import { setCredentials, setInitialized } from './store/slices/authSlice'

import Layout from './components/common/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LoansPage from './pages/LoansPage'
import PaymentsPage from './pages/PaymentsPage'
import AIAdvisorPage from './pages/AIAdvisorPage'
import ChatbotPage from './pages/ChatbotPage'
import BankPage from './pages/BankPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  const dispatch = useDispatch()
  const { initialized } = useSelector((s) => s.auth)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const res = await api.get('/auth/me')
          dispatch(setCredentials({ user: res.data.data.user, accessToken: token }))
        } catch {
          localStorage.removeItem('accessToken')
        }
      }
      dispatch(setInitialized())
    }
    init()
  }, [dispatch])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-2xl animate-pulse">💰</div>
          <p className="text-slate-400 text-sm">Loading Smart Debt Manager…</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/bank" element={<BankPage />} />
        <Route path="/advisor" element={<AIAdvisorPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// src/components/common/ProtectedRoute.jsx
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const { user, accessToken } = useSelector((s) => s.auth)
  if (!user && !accessToken) return <Navigate to="/login" replace />
  return children
}

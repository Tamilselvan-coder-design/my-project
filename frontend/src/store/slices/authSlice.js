import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data)
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data)
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout').catch(() => {})
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/users/profile', data)
    return res.data.data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      localStorage.setItem('accessToken', action.payload.accessToken)
    },
    clearCredentials: (state) => {
      state.user = null
      state.accessToken = null
      localStorage.removeItem('accessToken')
    },
    setInitialized: (state) => { state.initialized = true },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null }
    const handleFulfilled = (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      localStorage.setItem('accessToken', action.payload.accessToken)
    }
    const handleRejected = (state, action) => {
      state.loading = false
      state.error = action.payload
      toast.error(action.payload)
    }

    builder
      .addCase(register.pending, handlePending)
      .addCase(register.fulfilled, handleFulfilled)
      .addCase(register.rejected, handleRejected)
      .addCase(login.pending, handlePending)
      .addCase(login.fulfilled, handleFulfilled)
      .addCase(login.rejected, handleRejected)
      .addCase(logout.fulfilled, (state) => {
        state.user = null; state.accessToken = null
        localStorage.removeItem('accessToken')
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
        toast.success('Profile updated!')
      })
  },
})

export const { setCredentials, clearCredentials, setInitialized, clearError } = authSlice.actions
export default authSlice.reducer

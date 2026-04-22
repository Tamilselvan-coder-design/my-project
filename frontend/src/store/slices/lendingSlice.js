import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export const fetchLendings = createAsyncThunk('lending/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/lending')
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const fetchLendingDashboard = createAsyncThunk('lending/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/lending/dashboard')
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const createLending = createAsyncThunk('lending/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/lending', data)
    toast.success('Lending created! Borrower will be notified.')
    return res.data.data.lending
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to create lending')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const recordPayment = createAsyncThunk('lending/payment', async ({ id, amount, note }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/lending/${id}/payments`, { amount, note })
    toast.success('Payment recorded!')
    return res.data.data.lending
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to record payment')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const deleteLending = createAsyncThunk('lending/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/lending/${id}`)
    toast.success('Lending deleted')
    return id
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to delete')
    return rejectWithValue(err.response?.data?.message)
  }
})

const lendingSlice = createSlice({
  name: 'lending',
  initialState: {
    items: [],
    dashboard: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLendings.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchLendings.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.lendings
        state.dashboard = action.payload.summary
      })
      .addCase(fetchLendings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchLendingDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload.stats
      })
      .addCase(createLending.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        const idx = state.items.findIndex(l => l._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteLending.fulfilled, (state, action) => {
        state.items = state.items.filter(l => l._id !== action.payload)
      })
  },
})

export default lendingSlice.reducer
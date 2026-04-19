import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export const fetchLoans = createAsyncThunk('loans/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/loans')
    return res.data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const fetchDashboard = createAsyncThunk('loans/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/loans/dashboard')
    return res.data.data
  } catch (err) { return rejectWithValue(err.response?.data?.message) }
})

export const createLoan = createAsyncThunk('loans/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/loans', data)
    toast.success('Loan added successfully!')
    return res.data.data.loan
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add loan')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const updateLoan = createAsyncThunk('loans/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/loans/${id}`, data)
    toast.success('Loan updated!')
    return res.data.data.loan
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to update loan')
    return rejectWithValue(err.response?.data?.message)
  }
})

export const deleteLoan = createAsyncThunk('loans/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/loans/${id}`)
    toast.success('Loan deleted')
    return id
  } catch (err) {
    toast.error('Failed to delete loan')
    return rejectWithValue(err.response?.data?.message)
  }
})

const loanSlice = createSlice({
  name: 'loans',
  initialState: {
    items: [], dashboard: null, loading: false, error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (state) => { state.loading = true })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.loading = false; state.items = action.payload.loans
      })
      .addCase(fetchLoans.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.dashboard = action.payload })
      .addCase(createLoan.fulfilled, (state, action) => { state.items.unshift(action.payload) })
      .addCase(updateLoan.fulfilled, (state, action) => {
        const idx = state.items.findIndex(l => l._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteLoan.fulfilled, (state, action) => {
        state.items = state.items.filter(l => l._id !== action.payload)
      })
  },
})

export default loanSlice.reducer

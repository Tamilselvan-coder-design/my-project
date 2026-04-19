import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import loanReducer from './slices/loanSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loans: loanReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
})

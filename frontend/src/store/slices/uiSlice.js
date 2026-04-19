import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, darkMode: true },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    toggleDarkMode: (state) => { state.darkMode = !state.darkMode },
  },
})

export const { toggleSidebar, toggleDarkMode } = uiSlice.actions
export default uiSlice.reducer

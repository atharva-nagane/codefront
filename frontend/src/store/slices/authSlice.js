import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoggedIn: false,
  user: null,
  loading: true, // true until first auth check completes
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.isLoggedIn = true
      state.user = action.payload
      state.loading = false
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.user = null
      state.loading = false
    },
  },
})

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer
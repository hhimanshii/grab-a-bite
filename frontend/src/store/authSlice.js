import { createSlice } from "@reduxjs/toolkit"

const defaultAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
}

function loadPersistedAuth() {
  if (typeof window === "undefined") {
    return defaultAuthState
  }

  try {
    const storedAuth = window.localStorage.getItem("auth-storage")

    if (!storedAuth) {
      return defaultAuthState
    }

    const parsedAuth = JSON.parse(storedAuth)
    return {
      ...defaultAuthState,
      ...parsedAuth,
      isAuthenticated: Boolean(parsedAuth?.token && parsedAuth?.user),
    }
  } catch {
    return defaultAuthState
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadPersistedAuth(),
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { loginSuccess, logout, updateUser } = authSlice.actions
export default authSlice.reducer

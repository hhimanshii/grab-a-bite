import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/store/authSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

if (typeof window !== "undefined") {
  store.subscribe(() => {
    const { auth } = store.getState()

    window.localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        user: auth.user,
        token: auth.token,
        isAuthenticated: auth.isAuthenticated,
      })
    )
  })
}

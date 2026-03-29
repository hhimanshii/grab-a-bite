import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useLocation } from "react-router-dom"

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!isAuthenticated) {
      navigate("/login")
    } else if (user && !allowedRoles.includes(user.role)) {
      // Redirect based on role if they try to access a route they don't have access to
      if (user.role === "superadmin") navigate("/admin/restaurants")
      else if (user.role === "owner") navigate("/dashboard")
      else navigate("/pos")
    }
  }, [isAuthenticated, user, allowedRoles, navigate, mounted, pathname])

  if (!mounted) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>
  }

  return <>{children}</>
}

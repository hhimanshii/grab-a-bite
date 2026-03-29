import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
    } else if (user && !allowedRoles.includes(user.role)) {
      // Redirect based on role if they try to access a route they don't have access to
      if (user.role === "superadmin") navigate("/admin/restaurants")
      else if (user.role === "owner") navigate("/dashboard")
      else navigate("/pos")
    }
  }, [isAuthenticated, user, allowedRoles, navigate])

  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>
  }

  return <>{children}</>
}

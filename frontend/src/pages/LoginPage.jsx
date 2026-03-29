import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import api from "@/lib/axios"
import { loginSuccess } from "@/store/authSlice"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "superadmin") navigate("/admin/restaurants")
      else if (user.role === "owner") navigate("/dashboard")
      else navigate("/pos")
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!identifier || !password) {
      return toast.error("Please enter both email/phone and password")
    }

    setLoading(true)
    try {
      const res = await api.post("/auth/login", {
        login: identifier,
        password,
      })

      const { user: userData, token } = res.data.data

      dispatch(loginSuccess({ user: userData, token }))
      toast.success("Login successful!")

      if (userData.role === "superadmin") navigate("/admin/restaurants")
      else if (userData.role === "owner") navigate("/dashboard")
      else navigate("/pos")
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Invalid credentials or Server Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-zinc-900">
      <Card className="w-full max-w-md border-0 bg-white/80 shadow-lg backdrop-blur-xl dark:bg-zinc-900/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold font-heading text-transparent">
            Grab-a-Bite
          </CardTitle>
          <CardDescription className="text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="name@example.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="h-11 w-full text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact your administrator</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

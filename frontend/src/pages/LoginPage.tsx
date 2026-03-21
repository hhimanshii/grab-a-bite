import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuthStore()
  
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "superadmin") navigate("/admin/restaurants")
      else if (user.role === "owner") navigate("/dashboard")
      else navigate("/pos")
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) {
      return toast.error("Please enter both email/phone and password")
    }
    
    setLoading(true)
    try {
      // Send credentials to backend
      const res = await api.post("/auth/login", { 
        login: identifier, 
        password 
      })
      
      const { user: userData, token } = res.data.data
      
      // Update store
      login(userData, token)
      toast.success("Login successful!")
      
      // Redirect based on role
      if (userData.role === "superadmin") navigate("/admin/restaurants")
      else if (userData.role === "owner") navigate("/dashboard")
      else navigate("/pos")
      
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "Invalid credentials or Server Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-bold font-heading bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" 
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

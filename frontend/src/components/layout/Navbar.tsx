import { useAuthStore } from "@/store/useAuthStore"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export function Navbar({ title = "Grab-a-Bite" }: { title?: string }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-bold font-heading">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline-block font-medium">
              {user.name} ({user.role})
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline-block">Logout</span>
        </Button>
      </div>
    </header>
  )
}

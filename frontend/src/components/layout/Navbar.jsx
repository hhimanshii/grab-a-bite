import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import api from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LogOut, User, KeyRound } from "lucide-react"
import { logout } from "@/store/authSlice"
import { useState } from "react"
import { toast } from "sonner"

export function Navbar({ title = "Grab-a-Bite" }) {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error("Please fill in all password fields")
    }

    if (passwordForm.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters long")
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New password and confirm password must match")
    }

    setIsSubmittingPassword(true)

    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      toast.success("Password changed successfully")
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsPasswordDialogOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password")
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handlePasswordDialogOpenChange = (open, details) => {
    if (open) {
      setIsPasswordDialogOpen(true)
      return
    }

    if (!details || details.reason === "close-press") {
      setIsPasswordDialogOpen(false)
    }
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
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={handlePasswordDialogOpenChange}
          disablePointerDismissal
        >
          <DialogTrigger
            render={
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline-block">Change Password</span>
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  disabled={isSubmittingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  disabled={isSubmittingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  disabled={isSubmittingPassword}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline-block">Logout</span>
        </Button>
      </div>
    </header>
  )
}

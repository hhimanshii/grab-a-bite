import { useState } from "react"
import { useSelector } from "react-redux"
import api from "@/lib/axios"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Eye, EyeOff, KeyRound, Clock } from "lucide-react"

export default function AccountSettingsPage() {
  const { user } = useSelector((state) => state.auth)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      return toast.error("Please fill in all password fields")
    }

    if (formData.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters long")
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New password and confirm password must match")
    }

    setIsSubmitting(true)

    try {
      await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })

      toast.success("Password changed successfully")
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsPasswordDialogOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password")
    } finally {
      setIsSubmitting(false)
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-heading">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and password.</p>
      </div>

      {user?.role === "owner" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Plan
            </CardTitle>
            <CardDescription>Your current Grab-a-Bite partner plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">Active</div>
            <p className="text-sm text-muted-foreground">Grab-a-Bite Partner</p>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Signed in as {user?.name || "User"} {user?.role ? `(${user.role})` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={handlePasswordDialogOpenChange}
            disablePointerDismissal
          >
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(event) => setFormData({ ...formData, currentPassword: event.target.value })}
                      className="pr-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                    >
                      {showCurrentPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(event) => setFormData({ ...formData, newPassword: event.target.value })}
                      className="pr-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword((value) => !value)}
                    >
                      {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                      className="pr-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                    >
                      {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}

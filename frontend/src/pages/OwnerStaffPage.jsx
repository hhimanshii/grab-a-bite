import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MoreHorizontal, Eye, EyeOff } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function OwnerStaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get("/restaurant/users")
      setStaff(res.data.data || res.data)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch staff")
    } finally {
      setLoading(false)
    }
  }

  const resetPasswordVisibility = () => {
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleDialogOpenChange = (open, details) => {
    if (open) {
      setIsDialogOpen(true)
      return
    }

    if (!details || details.reason === "close-press") {
      setIsDialogOpen(false)
      resetPasswordVisibility()
    }
  }

  const handleOpenDialog = (member) => {
    if (member) {
      setEditingId(member._id)
      setFormData({
        name: member.name || "",
        phone: member.phone || "",
        email: member.email || "",
        password: "",
        confirmPassword: "",
        role: member.role || "",
      })
    } else {
      setEditingId(null)
      setFormData({ name: "", phone: "", email: "", password: "", confirmPassword: "", role: "" })
    }
    resetPasswordVisibility()
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return toast.error("Name and Phone are required")
    if (!formData.role) return toast.error("Please select a role")
    if (!editingId && !formData.password) return toast.error("Initial password is required")
    if (formData.password && formData.password.length < 6) return toast.error("Password must be at least 6 characters long")
    if (formData.password !== formData.confirmPassword) return toast.error("Password and confirm password must match")

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        role: formData.role,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (editingId) {
        await api.put(`/restaurant/users/${editingId}`, payload)
        toast.success("Staff updated successfully")
      } else {
        await api.post("/restaurant/users", payload)
        toast.success("Staff created successfully")
      }
      setIsDialogOpen(false)
      resetPasswordVisibility()
      fetchStaff()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to save staff")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return
    try {
      await api.delete(`/restaurant/users/${id}`)
      toast.success("Staff deleted successfully")
      fetchStaff()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete staff")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Staff Management</h2>
        <Dialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          disablePointerDismissal
        >
          <DialogTrigger
            render={
              <Button onClick={() => handleOpenDialog()} className="gap-2 font-outfit">
                <Plus className="h-4 w-4" /> Add Staff
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Staff" : "Add Staff"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="staff-name"
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Login ID)</Label>
                <Input
                  id="phone"
                  name="staff-phone"
                  autoComplete="off"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  name="staff-email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. staff@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingId ? "New Password (Optional)" : "Initial Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="staff-password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Leave blank to keep current password" : "At least 6 characters"}
                    className="pr-10"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {editingId ? "Confirm New Password" : "Confirm Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="staff-confirm-password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={editingId ? "Repeat the new password" : "Repeat the password"}
                    className="pr-10"
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
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => { if (value) setFormData({ ...formData, role: value }) }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unselected" disabled label="Select role">Select role</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Staff"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading staff...
                </TableCell>
              </TableRow>
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium font-bold font-heading">{member.name}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell className="capitalize">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(member)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(member._id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

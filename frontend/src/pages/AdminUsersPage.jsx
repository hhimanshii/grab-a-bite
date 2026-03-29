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

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    restaurantId: "none",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, restRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/restaurants"),
      ])
      setUsers(usersRes.data.data || usersRes.data)
      setRestaurants(restRes.data.data || restRes.data)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch data")
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

  const handleOpenDialog = (user) => {
    if (user) {
      setEditingId(user._id)
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        role: user.role || "owner",
        restaurantId: user.restaurantId?._id || user.restaurantId || "none",
      })
    } else {
      setEditingId(null)
      setFormData({ name: "", phone: "", email: "", password: "", confirmPassword: "", role: "", restaurantId: "none" })
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
    if (formData.role !== "superadmin" && formData.restaurantId === "none") {
      return toast.error("Please select a restaurant for non-superadmin users")
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        role: formData.role,
        restaurantId: formData.restaurantId === "none" ? null : formData.restaurantId,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (editingId) {
        await api.put(`/admin/users/${editingId}`, payload)
        toast.success("User updated successfully")
      } else {
        await api.post("/admin/users", payload)
        toast.success("User created successfully")
      }
      setIsDialogOpen(false)
      resetPasswordVisibility()
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to save user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success("User deleted successfully")
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user")
    }
  }

  const getRestaurantName = (id) => {
    if (!id) return "N/A"
    const searchId = typeof id === "object" ? id?._id : id
    const r = restaurants.find(r => r._id === searchId)
    return r ? r.name : "N/A"
  }

  const restaurantItems = [
    { value: "none", label: "-- Select Restaurant --" },
    ...restaurants.map((restaurant) => ({
      value: restaurant._id,
      label: restaurant.name,
    })),
  ]

  const roleItems = [
    { value: "all", label: "All Roles" },
    { value: "superadmin", label: "Super Admin" },
    { value: "owner", label: "Owner" },
    { value: "manager", label: "Manager" },
    { value: "cashier", label: "Cashier" },
    { value: "waiter", label: "Waiter" },
  ]

  const filteredUsers = users.filter((user) => roleFilter === "all" || user.role === roleFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Users Management</h2>
        <Dialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          disablePointerDismissal
        >
          <DialogTrigger
            render={
              <Button onClick={() => handleOpenDialog()} className="gap-2 font-outfit">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="user-name"
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Login ID)</Label>
                <Input
                  id="phone"
                  name="user-phone"
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
                  name="user-email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
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
                    name="user-password"
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
                    name="user-confirm-password"
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
                  onValueChange={(value) => {
                    if (!value) return

                    setFormData({
                      ...formData,
                      role: value,
                      restaurantId: value === "superadmin" ? "none" : formData.restaurantId,
                    })
                  }}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unselected" disabled label="Select role">Select role</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.role && formData.role !== "superadmin" && (
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurant</Label>
                  <Select
                    items={restaurantItems}
                    value={formData.restaurantId}
                    onValueChange={(value) => { if (value) setFormData({ ...formData, restaurantId: value }) }}
                  >
                    <SelectTrigger id="restaurant">
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" label="-- Select Restaurant --">-- Select Restaurant --</SelectItem>
                      {restaurants.map(r => (
                        <SelectItem key={r._id} value={r._id} label={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full max-w-[220px]">
        <Label className="mb-2 block">Filter by Role</Label>
        <Select
          items={roleItems}
          value={roleFilter}
          onValueChange={(value) => { if (value) setRoleFilter(value) }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="All Roles">All Roles</SelectItem>
            <SelectItem value="superadmin" label="Super Admin">Super Admin</SelectItem>
            <SelectItem value="owner" label="Owner">Owner</SelectItem>
            <SelectItem value="manager" label="Manager">Manager</SelectItem>
            <SelectItem value="cashier" label="Cashier">Cashier</SelectItem>
            <SelectItem value="waiter" label="Waiter">Waiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium text-heading font-bold">{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell className="capitalize">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'owner' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{getRestaurantName(user.restaurantId)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(user._id)}>
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

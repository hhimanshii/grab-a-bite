import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react"
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

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "owner",
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

  const handleOpenDialog = (user) => {
    if (user) {
      setEditingId(user._id)
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        role: user.role || "owner",
        restaurantId: user.restaurantId?._id || user.restaurantId || "none",
      })
    } else {
      setEditingId(null)
      setFormData({ name: "", phone: "", role: "owner", restaurantId: "none" })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) return toast.error("Name and Phone are required")
    if (formData.role !== "superadmin" && formData.restaurantId === "none") {
      return toast.error("Please select a restaurant for non-superadmin users")
    }

    setIsSubmitting(true)
    try {
      const payload = { ...formData, restaurantId: formData.restaurantId === "none" ? null : formData.restaurantId }
      if (editingId) {
        await api.put(`/admin/users/${editingId}`, payload)
        toast.success("User updated successfully")
      } else {
        await api.post("/admin/users", payload)
        toast.success("User created successfully")
      }
      setIsDialogOpen(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Users Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Login ID)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
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
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.role !== "superadmin" && (
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurant</Label>
                  <Select
                    value={formData.restaurantId}
                    onValueChange={(value) => { if (value) setFormData({ ...formData, restaurantId: value }) }}
                  >
                    <SelectTrigger id="restaurant">
                      <SelectValue placeholder="Select restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Select Restaurant --</SelectItem>
                      {restaurants.map(r => (
                        <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
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

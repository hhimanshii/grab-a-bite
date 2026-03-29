import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MoreHorizontal, Image as ImageIcon } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"

const CATEGORIES = ["Burgers", "Pizzas", "Drinks", "Sides", "Desserts"]

export default function OwnerMenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "Burgers",
    price: 0,
    description: "",
    imageUrl: "",
    isAvailable: true,
    prepTime: 15,
  })

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const res = await api.get("/menu")
      setMenuItems(res.data.data || res.data)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch menu")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (item) => {
    if (item) {
      setEditingId(item._id)
      setFormData({
        name: item.name || "",
        category: item.category || "Burgers",
        price: item.price || 0,
        description: item.description || "",
        imageUrl: item.imageUrl || item.image || "",
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        prepTime: item.prepTime || 15,
      })
    } else {
      setEditingId(null)
      setFormData({
        name: "", category: "Burgers", price: 0, description: "", imageUrl: "", isAvailable: true, prepTime: 15
      })
    }
    setIsDialogOpen(true)
  }

  const handleDialogOpenChange = (open, details) => {
    if (open) {
      setIsDialogOpen(true)
      return
    }

    if (!details || details.reason === "close-press") {
      setIsDialogOpen(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || formData.price <= 0) return toast.error("Name and valid price are required")

    setIsSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/menu/${editingId}`, formData)
        toast.success("Menu item updated")
      } else {
        await api.post("/menu", formData)
        toast.success("Menu item created")
      }
      setIsDialogOpen(false)
      fetchMenu()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to save menu item")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item?")) return
    try {
      await api.delete(`/menu/${id}`)
      toast.success("Item deleted")
      fetchMenu()
    } catch {
      toast.error("Failed to delete item")
    }
  }

  const toggleAvailability = async (item) => {
    try {
      await api.put(`/menu/${item._id}`, { ...item, isAvailable: !item.isAvailable })
      toast.success(`Marked as ${!item.isAvailable ? 'Available' : 'Unavailable'}`)
      fetchMenu()
    } catch {
      toast.error("Failed to update availability")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Menu Management</h2>
        <Dialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          disablePointerDismissal
        >
          <DialogTrigger
            render={
              <Button onClick={() => handleOpenDialog()} className="gap-2 font-outfit">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            }
          />
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input id="price" type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => { if (value) setFormData({ ...formData, category: value }) }}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Cloudinary or any link)</Label>
                <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4 items-center mt-2 border p-3 rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isAvailable" 
                    checked={formData.isAvailable} 
                    onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked === true })} 
                  />
                  <Label htmlFor="isAvailable" className="cursor-pointer">Currently Available</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepTime" className="text-xs">Prep Time (mins)</Label>
                  <Input id="prepTime" type="number" min="1" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: Number(e.target.value) })} className="h-8" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading menu...</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          No menu items found. Click "Add Item" to create your menu.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => (
            <Card key={item._id} className={!item.isAvailable ? "opacity-60 grayscale-[0.5]" : ""}>
              <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden rounded-t-lg">
                {item.imageUrl || item.image ? (
                  <img src={(item.imageUrl || item.image) || ""} alt={item.name || "Menu item"} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
              <CardContent className="p-4 space-y-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold line-clamp-1" title={item.name}>{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="font-bold">₹{item.price}</div>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                  {item.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`avail-${item._id}`} 
                      checked={item.isAvailable} 
                      onCheckedChange={() => toggleAvailability(item)} 
                    />
                    <Label htmlFor={`avail-${item._id}`} className="text-xs cursor-pointer">
                      {item.isAvailable ? "Available" : "Sold Out"}
                    </Label>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(item._id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

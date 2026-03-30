import { useEffect, useMemo, useState } from "react"
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import api from "@/lib/axios"
import { getMenuPlaceholder } from "@/lib/menuPlaceholders"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const DEFAULT_CATEGORIES = ["Burgers", "Pizzas", "Drinks", "Sides", "Desserts"]

const getDefaultFormData = () => ({
  name: "",
  category: "",
  price: "",
  description: "",
  imageUrl: "",
  isAvailable: true,
  prepTime: "",
})

const PlaceholderCard = ({ item }) => {
  const placeholder = getMenuPlaceholder(item)

  return (
    <div className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${placeholder.gradient} p-4`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.2em] ${placeholder.accent}`}>
        Fresh Pick
      </div>
      <div className={placeholder.accent}>
        <div className="text-3xl font-black tracking-tight">{placeholder.initials}</div>
        <div className="mt-1 line-clamp-1 text-sm font-medium">{placeholder.name}</div>
      </div>
      <div className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${placeholder.badge}`}>
        {placeholder.category}
      </div>
    </div>
  )
}

export default function OwnerMenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [formData, setFormData] = useState(getDefaultFormData)

  const categoryOptions = useMemo(() => {
    const categories = new Set(DEFAULT_CATEGORIES)

    menuItems.forEach((item) => {
      const category = item.category?.trim()
      if (category) {
        categories.add(category)
      }
    })

    return Array.from(categories).sort((left, right) => left.localeCompare(right))
  }, [menuItems])

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

  const resetForm = () => {
    setEditingId(null)
    setFormData(getDefaultFormData())
    setIsCustomCategory(false)
  }

  const handleOpenDialog = (item) => {
    if (item) {
      const currentCategory = item.category?.trim() || ""

      setEditingId(item._id)
      setFormData({
        name: item.name || "",
        category: currentCategory,
        price: item.price ?? "",
        description: item.description || "",
        imageUrl: item.imageUrl || item.image || "",
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        prepTime: item.prepTime ?? "",
      })
      setIsCustomCategory(currentCategory ? !categoryOptions.includes(currentCategory) : false)
    } else {
      resetForm()
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
      if (!editingId) {
        resetForm()
      }
    }
  }

  const handleCategorySelect = (value) => {
    setIsCustomCategory(false)
    setFormData((current) => ({ ...current, category: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedName = formData.name.trim()
    const normalizedCategory = formData.category.trim()
    const normalizedPrice = Number(formData.price)

    if (!normalizedName || !normalizedCategory || Number.isNaN(normalizedPrice) || normalizedPrice <= 0) {
      return toast.error("Name, category, and valid price are required")
    }

    const payload = {
      name: normalizedName,
      category: normalizedCategory,
      price: normalizedPrice,
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
      isAvailable: formData.isAvailable,
    }

    if (formData.prepTime !== "" && formData.prepTime !== null) {
      const prepTime = Number(formData.prepTime)

      if (Number.isNaN(prepTime) || prepTime <= 0) {
        return toast.error("Prep time must be a positive number")
      }

      payload.prepTime = prepTime
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/menu/${editingId}`, payload)
        toast.success("Menu item updated")
      } else {
        await api.post("/menu", payload)
        toast.success("Menu item created")
      }

      setIsDialogOpen(false)
      resetForm()
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
      toast.success(`Marked as ${!item.isAvailable ? "Available" : "Unavailable"}`)
      fetchMenu()
    } catch {
      toast.error("Failed to update availability")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange} disablePointerDismissal>
          <DialogTrigger
            render={(
              <Button onClick={() => handleOpenDialog()} className="gap-2 font-outfit">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            )}
          />
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Smoky Paneer Burger"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Rs)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="299"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={!isCustomCategory && formData.category ? formData.category : undefined}
                          onValueChange={handleCategorySelect}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant={isCustomCategory ? "default" : "outline"}
                        className="shrink-0"
                        onClick={() => {
                          setIsCustomCategory(true)
                          setFormData((current) => ({ ...current, category: "" }))
                        }}
                      >
                        Add New
                      </Button>
                    </div>
                    {isCustomCategory ? (
                      <div className="space-y-2">
                        <Input
                          id="customCategory"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Enter category name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto px-0 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setIsCustomCategory(false)
                            setFormData((current) => ({ ...current, category: "" }))
                          }}
                        >
                          Choose from existing categories instead
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
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
                  <Label htmlFor="prepTime" className="text-xs">Prep Time (mins, optional)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="1"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    className="h-8"
                    placeholder="15"
                  />
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
                  <PlaceholderCard item={item} />
                )}
              </div>
              <CardContent className="p-4 space-y-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold line-clamp-1" title={item.name}>{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="font-bold">Rs {item.price}</div>
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
                      render={(
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
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

import { useState, useEffect, useMemo } from "react"
import { Search, Plus, Minus, Trash2, Receipt, CheckCircle, ShoppingBag } from "lucide-react"
import api from "@/lib/axios"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const CATEGORIES = ["All", "Burgers", "Pizzas", "Drinks", "Sides", "Desserts"]

export default function POSPage() {
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")

  // Cart State
  const [cart, setCart] = useState<any[]>([])
  const [orderType, setOrderType] = useState("dine-in")
  
  // Current Order processing state
  const [isPlacing, setIsPlacing] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<any>(null)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const res = await api.get("/menu")
      // Only show available items for POS
      const items = (res.data.data || res.data).filter((i: any) => i.isAvailable !== false)
      setMenuItems(items)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch menu")
    } finally {
      setLoading(false)
    }
  }

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = category === "All" || item.category === category
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [menuItems, category, search])

  const addToCart = (item: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.menuItemId === item._id)
      if (exists) {
        return prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }]
    })
    if (placedOrder) setPlacedOrder(null)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === id) {
        const newQ = i.quantity + delta
        return newQ > 0 ? { ...i, quantity: newQ } : i
      }
      return i
    }))
    if (placedOrder) setPlacedOrder(null)
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== id))
    if (placedOrder) setPlacedOrder(null)
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty")
    
    setIsPlacing(true)
    try {
      const payload = {
        items: cart,
        orderType,
        total: cartTotal
      }
      const res = await api.post("/orders", payload)
      const data = res.data.data || res.data
      setPlacedOrder(data)
      toast.success("Order Placed (Pending)")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to place order")
    } finally {
      setIsPlacing(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!placedOrder) return toast.error("Please place the order first")
    
    setIsPlacing(true)
    try {
      await api.put(`/orders/${placedOrder._id}/status`, { status: "completed" })
      toast.success("Order Completed!")
      setCart([])
      setPlacedOrder(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to complete order")
    } finally {
      setIsPlacing(false)
    }
  }

  const handleGenerateReceipt = async () => {
    if (!placedOrder) return toast.error("No active order to print")
    try {
      const res = await api.get(`/orders/${placedOrder._id}/receipt`, { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }))
      window.open(url)
    } catch (error) {
      toast.error("Failed to generate receipt")
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-muted/10">
      <div className="flex-1 flex flex-col pt-4 px-6 pb-6 overflow-hidden">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search menu items..." 
              className="pl-9 bg-background shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="All" className="w-full mb-6" onValueChange={(val: string | null) => { if (val) setCategory(val) }}>
          <TabsList className="bg-background shadow-sm w-full justify-start overflow-x-auto h-auto p-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat} value={cat} className="px-4 py-2">{cat}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex justify-center py-12">Loading menu...</div>
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-background rounded-xl border">
              No items found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMenu.map(item => (
                <Card 
                  key={item._id} 
                  className="cursor-pointer hover:border-primary transition-all overflow-hidden flex flex-col group shadow-sm hover:shadow-md"
                  onClick={() => addToCart(item)}
                >
                  <div className="aspect-square bg-muted relative">
                    {item.imageUrl || item.image ? (
                      <img src={(item.imageUrl || item.image) || ""} alt={item.name || "Menu item"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase bg-secondary/50">
                        {item.category}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{item.name}</h4>
                    <span className="text-primary font-bold">₹{item.price}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="w-[380px] bg-background border-l flex flex-col shadow-xl z-10">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Current Order</h2>
          {placedOrder && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full uppercase">
              Pending
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 pt-12">
              <ShoppingBag className="h-12 w-12 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-3 bg-muted/30 rounded-lg border border-transparent hover:border-border transition-colors group">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1 line-clamp-1">{item.name}</h5>
                    <span className="text-primary font-bold text-sm">₹{item.price}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border rounded-md bg-background">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => updateQuantity(item.menuItemId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={() => updateQuantity(item.menuItemId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <button 
                      className="text-muted-foreground hover:text-destructive transition-colors text-xs flex items-center"
                      onClick={() => removeFromCart(item.menuItemId)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 bg-muted/10 border-t space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Order Type</span>
            <Select value={orderType} onValueChange={(v: string | null) => { if (v) setOrderType(v) }} disabled={!!placedOrder}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-bold text-primary">₹{cartTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-3 pt-2">
            {!placedOrder ? (
              <Button 
                className="w-full h-12 text-lg font-semibold" 
                size="lg"
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isPlacing}
              >
                Place Order
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold" 
                  onClick={handleCompleteOrder}
                  disabled={isPlacing}
                >
                  <CheckCircle className="mr-2 h-5 w-5" /> Complete
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-primary text-primary hover:bg-primary/5 font-semibold" 
                  onClick={handleGenerateReceipt}
                >
                  <Receipt className="mr-2 h-5 w-5" /> Receipt
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

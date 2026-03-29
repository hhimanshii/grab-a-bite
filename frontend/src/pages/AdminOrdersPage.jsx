import { useState, useEffect } from "react"
import { Eye, Download } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [restaurantFilter, setRestaurantFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // View Modal
  const [viewOrder, setViewOrder] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [ordersRes, restRes] = await Promise.all([
        api.get("/admin/orders"),
        api.get("/admin/restaurants")
      ])
      setOrders(ordersRes.data.data || ordersRes.data)
      setRestaurants(restRes.data.data || restRes.data)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async (orderId) => {
    try {
      const res = await api.get(`/admin/orders/${orderId}/receipt`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }))
      window.open(url)
    } catch {
      toast.error("Failed to download receipt")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchRest = restaurantFilter === "all" || (order.restaurantId?._id || order.restaurantId) === restaurantFilter
    const matchStatus = statusFilter === "all" || order.status === statusFilter
    return matchRest && matchStatus
  })

  const getRestaurantName = (id) => {
    if (!id) return "N/A"
    const searchId = typeof id === "object" ? id?._id : id
    const r = restaurants.find(r => r._id === searchId)
    return r ? r.name : "N/A"
  }

  const restaurantItems = [
    { value: "all", label: "All Restaurants" },
    ...restaurants.map((restaurant) => ({
      value: restaurant._id,
      label: restaurant.name,
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Cross-Restaurant Orders</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="w-full sm:w-[250px]">
          <Select
            items={restaurantItems}
            value={restaurantFilter}
            onValueChange={(value) => { if (value) setRestaurantFilter(value) }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All Restaurants">All Restaurants</SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r._id} value={r._id} label={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={(value) => { if (value) setStatusFilter(value) }}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Loading orders...</TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No orders found.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">{order.orderNumber || order._id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{getRestaurantName(order.restaurantId)}</TableCell>
                  <TableCell className="capitalize">{order.orderType}</TableCell>
                  <TableCell>₹{order.total || order.totalAmount || 0}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => setViewOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDownloadReceipt(order._id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Details - {viewOrder?.orderNumber || viewOrder?._id.slice(-6).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Restaurant:</span>
                <span className="font-medium">{getRestaurantName(viewOrder.restaurantId)}</span>
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{viewOrder.orderType}</span>
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{viewOrder.status}</span>
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{new Date(viewOrder.createdAt).toLocaleString()}</span>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {viewOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between font-bold">
                <span>Total</span>
                <span>₹{(viewOrder.total || viewOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

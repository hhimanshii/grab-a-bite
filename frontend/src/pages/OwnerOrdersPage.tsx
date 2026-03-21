import { useState, useEffect } from "react"
import { Eye, Download } from "lucide-react"
import api from "@/lib/axios"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

import { useAuthStore } from "@/store/useAuthStore"

export default function OwnerOrdersPage() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all")

  // View Modal
  const [viewOrder, setViewOrder] = useState<any>(null)

  useEffect(() => {
    if (user?.restaurantId) {
      fetchOrders()
    }
  }, [user?.restaurantId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get("/orders")
      setOrders(res.data.data || res.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async (orderId: string) => {
    try {
      const res = await api.get(`/orders/${orderId}/receipt`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }))
      window.open(url)
    } catch (error: any) {
      toast.error("Failed to download receipt")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter === "all" || order.status === statusFilter
    return matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Restaurant Orders</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-[200px]">
          <Select value={statusFilter} onValueChange={(val: string | null) => { if (val) setStatusFilter(val) }}>
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
                <TableCell colSpan={6} className="h-24 text-center">Loading orders...</TableCell>
              </TableRow>
            ) : !user?.restaurantId ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <p className="font-medium text-destructive">Not linked to a restaurant</p>
                    <p className="text-sm">Please contact the admin to link your account to a restaurant.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No orders found.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium font-bold font-heading">{order.orderNumber || order._id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell className="capitalize">{order.orderType}</TableCell>
                  <TableCell>₹{(order.total || order.totalAmount || 0).toFixed(2)}</TableCell>
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
                  {viewOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
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

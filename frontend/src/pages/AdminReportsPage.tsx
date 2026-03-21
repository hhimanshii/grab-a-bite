import { useState, useEffect } from "react"
import api from "@/lib/axios"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { IndianRupee, ShoppingBag } from "lucide-react"

export default function AdminReportsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [restaurantFilter, setRestaurantFilter] = useState("all")
  
  // Default to last 30 days
  const today = new Date()
  const lastMonth = new Date()
  lastMonth.setDate(today.getDate() - 30)
  
  const [startDate, setStartDate] = useState(lastMonth.toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0])

  // Data
  const [salesSummary, setSalesSummary] = useState({ totalOrders: 0, totalRevenue: 0 })
  const [topItems, setTopItems] = useState<any[]>([])

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [restaurantFilter, startDate, endDate])

  const fetchRestaurants = async () => {
    try {
      const res = await api.get("/admin/restaurants")
      setRestaurants(res.data.data || res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (restaurantFilter !== "all") queryParams.append("restaurantId", restaurantFilter)
      if (startDate) queryParams.append("startDate", startDate)
      if (endDate) queryParams.append("endDate", endDate)
      
      const queryStr = queryParams.toString()

      const [salesRes, itemsRes] = await Promise.all([
        api.get(`/admin/reports/sales?${queryStr}`),
        api.get(`/admin/reports/top-items?${queryStr}`)
      ])

      setSalesSummary(salesRes.data.data || salesRes.data || { totalOrders: 0, totalRevenue: 0 })
      setTopItems(itemsRes.data.data || itemsRes.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch report data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">System Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-lg border">
        <div className="space-y-2">
          <Label>Restaurant Filter</Label>
          <Select value={restaurantFilter} onValueChange={(value: string | null) => { if (value) setRestaurantFilter(value) }}>
            <SelectTrigger>
              <SelectValue placeholder="All Restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(salesSummary.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(salesSummary.totalOrders || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Loading data...</TableCell>
                </TableRow>
              ) : topItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No items sold in this period.</TableCell>
                </TableRow>
              ) : (
                topItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name || item._id}</TableCell>
                    <TableCell className="capitalize">{item.category || "General"}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity || 0}</TableCell>
                    <TableCell className="text-right">₹{(item.totalRevenue || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

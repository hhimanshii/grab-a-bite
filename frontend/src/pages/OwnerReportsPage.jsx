import { useState, useEffect } from "react"
import api from "@/lib/axios"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { IndianRupee, ShoppingBag, Users } from "lucide-react"

export default function OwnerReportsPage() {
  const [loading, setLoading] = useState(true)
  
  // Default to last 30 days
  const today = new Date()
  const lastMonth = new Date()
  lastMonth.setDate(today.getDate() - 30)
  
  const [startDate, setStartDate] = useState(lastMonth.toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0])

  // Data
  const [salesSummary, setSalesSummary] = useState({ totalOrders: 0, totalRevenue: 0 })
  const [topItems, setTopItems] = useState([])
  const [staffPerformance, setStaffPerformance] = useState([])

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams()
        if (startDate) queryParams.append("startDate", startDate)
        if (endDate) queryParams.append("endDate", endDate)

        const queryStr = queryParams.toString()

        const [salesRes, itemsRes, staffRes] = await Promise.all([
          api.get(`/reports/sales?${queryStr}`),
          api.get(`/reports/top-items?${queryStr}`),
          api.get(`/reports/staff?${queryStr}`)
        ])

        setSalesSummary(salesRes.data.data || salesRes.data || { totalOrders: 0, totalRevenue: 0 })
        setTopItems(itemsRes.data.data || itemsRes.data || [])
        setStaffPerformance(staffRes.data.data || staffRes.data || [])
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Failed to fetch report data")
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [startDate, endDate])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-heading">Restaurant Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card p-4 rounded-lg border w-full max-w-2xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">Loading data...</TableCell>
                  </TableRow>
                ) : topItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No items sold.</TableCell>
                  </TableRow>
                ) : (
                  topItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium font-bold">{item.name || item._id}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity || 0}</TableCell>
                      <TableCell className="text-right">₹{(item.totalRevenue || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Staff Performance</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead className="text-right">Orders Handled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">Loading data...</TableCell>
                  </TableRow>
                ) : staffPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No staff data.</TableCell>
                  </TableRow>
                ) : (
                  staffPerformance.map((staff, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium font-bold">{staff.staffName || staff._id}</TableCell>
                      <TableCell className="text-right">{staff.totalOrders || 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { Store, Users, ShoppingBag, BarChart } from "lucide-react"
import { Outlet } from "react-router-dom"

const adminLinks = [
  { title: "Restaurants", href: "/admin/restaurants", icon: <Store className="h-4 w-4" /> },
  { title: "Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { title: "Orders", href: "/admin/orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { title: "Reports", href: "/admin/reports", icon: <BarChart className="h-4 w-4" /> },
]

export function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <div className="flex min-h-screen flex-col">
        <Navbar title="Grab-a-Bite Super Admin" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar links={adminLinks} />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

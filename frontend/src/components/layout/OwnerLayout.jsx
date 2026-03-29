import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { LayoutDashboard, Menu as MenuIcon, ShoppingBag, Users, BarChart, Settings } from "lucide-react"
import { Outlet } from "react-router-dom"

const ownerLinks = [
  { title: "Overview", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Menu", href: "/dashboard/menu", icon: <MenuIcon className="h-4 w-4" /> },
  { title: "Orders", href: "/dashboard/orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { title: "Staff", href: "/dashboard/staff", icon: <Users className="h-4 w-4" /> },
  { title: "Reports", href: "/dashboard/reports", icon: <BarChart className="h-4 w-4" /> },
  { title: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
]

export function OwnerLayout() {
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="flex min-h-screen flex-col">
        <Navbar title="Grab-a-Bite Dashboard" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar links={ownerLinks} />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

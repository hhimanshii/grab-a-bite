import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { Navbar } from "@/components/layout/Navbar"
import { Outlet } from "react-router-dom"

export function POSLayout() {
  return (
    <ProtectedRoute allowedRoles={["cashier", "waiter", "manager", "superadmin", "owner"]}>
      <div className="flex min-h-screen flex-col">
        <Navbar title="Grab-a-Bite POS" />
        <main className="flex-1 bg-muted/10">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  )
}

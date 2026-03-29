import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import POSPage from "@/pages/POSPage"
import { POSLayout } from "@/components/layout/POSLayout"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { OwnerLayout } from "@/components/layout/OwnerLayout"
import AdminRestaurantsPage from "@/pages/AdminRestaurantsPage"
import AdminUsersPage from "@/pages/AdminUsersPage"
import AdminOrdersPage from "@/pages/AdminOrdersPage"
import AdminReportsPage from "@/pages/AdminReportsPage"
import OwnerOverviewPage from "@/pages/OwnerOverviewPage"
import OwnerMenuPage from "@/pages/OwnerMenuPage"
import OwnerStaffPage from "@/pages/OwnerStaffPage"
import OwnerOrdersPage from "@/pages/OwnerOrdersPage"
import OwnerReportsPage from "@/pages/OwnerReportsPage"
import { Toaster } from "sonner"

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected POS Routes */}
        <Route path="/pos" element={<POSLayout />}>
          <Route index element={<POSPage />} />
        </Route>
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/restaurants" replace />} />
          <Route path="restaurants" element={<AdminRestaurantsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>
        
        {/* Protected Owner Routes */}
        <Route path="/dashboard" element={<OwnerLayout />}>
          <Route index element={<OwnerOverviewPage />} />
          <Route path="menu" element={<OwnerMenuPage />} />
          <Route path="staff" element={<OwnerStaffPage />} />
          <Route path="orders" element={<OwnerOrdersPage />} />
          <Route path="reports" element={<OwnerReportsPage />} />
        </Route>
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

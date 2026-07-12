import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import MobileSidebar from '../components/layout/MobileSidebar'
import TopHeader from '../components/layout/TopHeader'
import RoutePermissionGuard from '../routes/RoutePermissionGuard'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-slate-50">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <RoutePermissionGuard>
            <Outlet />
          </RoutePermissionGuard>
        </main>
      </div>
    </div>
  )
}

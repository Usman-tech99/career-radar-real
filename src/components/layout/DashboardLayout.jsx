import { Outlet } from 'react-router-dom'
import DashboardSidebar from './DashboardSidebar'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#07070C]">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <Outlet />
      </div>
    </div>
  )
}

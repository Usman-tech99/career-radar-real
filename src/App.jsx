import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import { ProtectedRoute } from './routes/ProtectedRoute'
import { SuperAdminRoute } from './routes/SuperAdminRoute'
import { CollaboratorRoute } from './routes/CollaboratorRoute'
import { UserRoute } from './routes/UserRoute'

import Home from './pages/public/Home'
import Jobs from './pages/public/Jobs'
import WeeklyContent from './pages/public/WeeklyContent'
import Education from './pages/public/Education'
import Scholarships from './pages/public/Scholarships'
import Shop from './pages/public/Shop'
import Team from './pages/public/Team'
import Structure from './pages/public/Structure'
import About from './pages/public/About'
import Social from './pages/public/Social'
import Collaborators from './pages/public/Collaborators'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

import Dashboard from './pages/user/Dashboard'
import Blueprint from './pages/user/Blueprint'
import Score from './pages/user/Score'
import UserProfile from './pages/user/UserProfile'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManageJobs from './pages/admin/ManageJobs'
import ManageContent from './pages/admin/ManageContent'
import ManageProducts from './pages/admin/ManageProducts'
import ManageEducation from './pages/admin/ManageEducation'
import ManageScholarships from './pages/admin/ManageScholarships'
import ManageStructure from './pages/admin/ManageStructure'
import ManageAbout from './pages/admin/ManageAbout'
import ManageSocials from './pages/admin/ManageSocials'
import ManageCollaborators from './pages/admin/ManageCollaborators'
import ManageTeam from './pages/admin/ManageTeam'
import ManageTeamMembers from './pages/admin/ManageTeamMembers'
import ManagePayments from './pages/admin/ManagePayments'
import AIInsights from './pages/admin/AIInsights'
import MyProfile from './pages/admin/MyProfile'

import RadarAIBubble from './components/ai/RadarAIBubble'
import RadarCursor from './components/ui/RadarCursor'

function HomeRedirect() {
  const { user, role, loading, roleChecked } = useAuth()

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    if (role === 'super_admin' || role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (role === 'collaborator') {
      return <Navigate to="/admin/my-profile" replace />
    }
    if (role) {
      return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/onboarding" replace />
  }

  return <Home />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RadarCursor />
        <RadarAIBubble />
        <Toaster position="bottom-center" />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          {/* PUBLIC */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/weekly-content" element={<WeeklyContent />} />
          <Route path="/education" element={<Education />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/team" element={<Team />} />
          <Route path="/structure" element={<Structure />} />
          <Route path="/about" element={<About />} />
          <Route path="/social" element={<Social />} />
          <Route path="/collaborators" element={<Collaborators />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* USER DASHBOARD */}
          <Route element={<UserRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/blueprint" element={<Blueprint />} />
            <Route path="/dashboard/score" element={<Score />} />
            <Route path="/dashboard/profile" element={<UserProfile />} />
          </Route>

          {/* ADMIN — super_admin + admin */}
          <Route element={<ProtectedRoute allowedRoles={["super_admin","admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/manage-jobs" element={<ManageJobs />} />
            <Route path="/admin/manage-content" element={<ManageContent />} />
            <Route path="/admin/manage-products" element={<ManageProducts />} />
            <Route path="/admin/manage-education" element={<ManageEducation />} />
            <Route path="/admin/manage-scholarships" element={<ManageScholarships />} />
            <Route path="/admin/manage-about" element={<ManageAbout />} />
            <Route path="/admin/manage-socials" element={<ManageSocials />} />
            <Route path="/admin/manage-collaborators" element={<ManageCollaborators />} />
          </Route>

          {/* FOUNDER ONLY */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/admin/manage-structure" element={<ManageStructure />} />
            <Route path="/admin/manage-team" element={<ManageTeam />} />
            <Route path="/admin/manage-team-members" element={<ManageTeamMembers />} />
            <Route path="/admin/manage-payments" element={<ManagePayments />} />
            <Route path="/admin/ai-insights" element={<AIInsights />} />
          </Route>

          {/* COLLABORATOR ONLY */}
          <Route element={<CollaboratorRoute />}>
            <Route path="/admin/my-profile" element={<MyProfile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

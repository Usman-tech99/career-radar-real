import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

import { ProtectedRoute } from './routes/ProtectedRoute'
import { SuperAdminRoute } from './routes/SuperAdminRoute'
import { CollaboratorRoute } from './routes/CollaboratorRoute'
import { UserRoute } from './routes/UserRoute'

// Public Pages
import Home from './pages/public/Home'
import Jobs from './pages/public/Jobs'
import WeeklyContent from './pages/public/WeeklyContent'
import Education from './pages/public/Education'
import Shop from './pages/public/Shop'
import Team from './pages/public/Team'
import Structure from './pages/public/Structure'
import About from './pages/public/About'
import Social from './pages/public/Social'
import Collaborators from './pages/public/Collaborators'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

// User Pages
import Dashboard from './pages/user/Dashboard'
import Blueprint from './pages/user/Blueprint'
import Score from './pages/user/Score'
import UserProfile from './pages/user/UserProfile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageJobs from './pages/admin/ManageJobs'
import ManageContent from './pages/admin/ManageContent'
import ManageProducts from './pages/admin/ManageProducts'
import ManageEducation from './pages/admin/ManageEducation'
import ManageStructure from './pages/admin/ManageStructure'
import ManageAbout from './pages/admin/ManageAbout'
import ManageSocials from './pages/admin/ManageSocials'
import ManageCollaborators from './pages/admin/ManageCollaborators'
import ManageTeam from './pages/admin/ManageTeam'
import ManagePayments from './pages/admin/ManagePayments'
import AIInsights from './pages/admin/AIInsights'
import MyProfile from './pages/admin/MyProfile'

// AI
import RadarAIBubble from './components/ai/RadarAIBubble'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RadarAIBubble />
        <Toaster position="bottom-center" />
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/weekly-content" element={<WeeklyContent />} />
          <Route path="/education" element={<Education />} />
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
            <Route path="/admin/manage-structure" element={<ManageStructure />} />
            <Route path="/admin/manage-about" element={<ManageAbout />} />
            <Route path="/admin/manage-socials" element={<ManageSocials />} />
            <Route path="/admin/manage-collaborators" element={<ManageCollaborators />} />
          </Route>

          {/* FOUNDER ONLY */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/admin/manage-team" element={<ManageTeam />} />
            <Route path="/admin/manage-payments" element={<ManagePayments />} />
            <Route path="/admin/ai-insights" element={<AIInsights />} />
          </Route>

          {/* COLLABORATOR ONLY */}
          <Route element={<CollaboratorRoute />}>
            <Route path="/admin/my-profile" element={<MyProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

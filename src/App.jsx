import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import { ProtectedRoute } from './routes/ProtectedRoute'
import { SuperAdminRoute } from './routes/SuperAdminRoute'
import { CollaboratorRoute } from './routes/CollaboratorRoute'
import { UserRoute } from './routes/UserRoute'

import RadarAIBubble from './components/ai/RadarAIBubble'
import RadarCursor from './components/ui/RadarCursor'

const Home = lazy(() => import('./pages/public/Home'))
const Jobs = lazy(() => import('./pages/public/Jobs'))
const WeeklyContent = lazy(() => import('./pages/public/WeeklyContent'))
const Education = lazy(() => import('./pages/public/Education'))
const Scholarships = lazy(() => import('./pages/public/Scholarships'))
const Shop = lazy(() => import('./pages/public/Shop'))
const Team = lazy(() => import('./pages/public/Team'))
const Donate = lazy(() => import('./pages/public/Donate'))
const Structure = lazy(() => import('./pages/public/Structure'))
const About = lazy(() => import('./pages/public/About'))
const Social = lazy(() => import('./pages/public/Social'))
const Collaborators = lazy(() => import('./pages/public/Collaborators'))
const NotFound = lazy(() => import('./pages/public/NotFound'))

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Onboarding = lazy(() => import('./pages/auth/Onboarding'))

const Dashboard = lazy(() => import('./pages/user/Dashboard'))
const Blueprint = lazy(() => import('./pages/user/Blueprint'))
const Score = lazy(() => import('./pages/user/Score'))
const UserProfile = lazy(() => import('./pages/user/UserProfile'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageJobs = lazy(() => import('./pages/admin/ManageJobs'))
const ManageContent = lazy(() => import('./pages/admin/ManageContent'))
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'))
const ManageEducation = lazy(() => import('./pages/admin/ManageEducation'))
const ManageScholarships = lazy(() => import('./pages/admin/ManageScholarships'))
const ManageStructure = lazy(() => import('./pages/admin/ManageStructure'))
const ManageAbout = lazy(() => import('./pages/admin/ManageAbout'))
const ManageSocials = lazy(() => import('./pages/admin/ManageSocials'))
const ManageCollaborators = lazy(() => import('./pages/admin/ManageCollaborators'))
const ManageTeam = lazy(() => import('./pages/admin/ManageTeam'))
const ManageTeamMembers = lazy(() => import('./pages/admin/ManageTeamMembers'))
const ManagePayments = lazy(() => import('./pages/admin/ManagePayments'))
const AIInsights = lazy(() => import('./pages/admin/AIInsights'))
const MyProfile = lazy(() => import('./pages/admin/MyProfile'))

function Loader() {
  return (
    <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function HomeRedirect() {
  const { user, role, loading, roleChecked, onboardingComplete } = useAuth()

  if (loading || !roleChecked) return <Loader />

  if (user) {
    if (role === 'super_admin' || role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'collaborator') return <Navigate to="/admin/my-profile" replace />
    if (role || onboardingComplete) return <Navigate to="/dashboard" replace />
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
        <Suspense fallback={<Loader />}>
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
            <Route path="/donate" element={<Donate />} />

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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
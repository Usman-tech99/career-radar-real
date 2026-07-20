import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import { ProtectedRoute } from './routes/ProtectedRoute'
import { SuperAdminRoute } from './routes/SuperAdminRoute'
import { CollaboratorRoute } from './routes/CollaboratorRoute'
import { UserRoute } from './routes/UserRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import AdminLayout from './components/layout/AdminLayout'

// Import RadarAIBubble and RadarCursor lazily as they are heavy
const RadarAIBubble = lazy(() => import('./components/ai/RadarAIBubble'))
const RadarCursor = lazy(() => import('./components/ui/RadarCursor'))
const PopupModal = lazy(() => import('./components/PopupModal'))
const AnnouncementPopup = lazy(() => import('./components/AnnouncementPopup'))
const CookieConsentBanner = lazy(() => import('./components/CookieConsentBanner'))
// Keep existing imports...
const Home = lazy(() => import('./pages/public/Home'))
const Jobs = lazy(() => import('./pages/public/Jobs'))
const WeeklyContent = lazy(() => import('./pages/public/WeeklyContent'))
const Education = lazy(() => import('./pages/public/Education'))
const Scholarships = lazy(() => import('./pages/public/Scholarships'))
const Products = lazy(() => import('./pages/public/Shop'))
const Team = lazy(() => import('./pages/public/Team'))
const Donate = lazy(() => import('./pages/public/Donate'))
const Structure = lazy(() => import('./pages/public/Structure'))
const About = lazy(() => import('./pages/public/About'))
const Social = lazy(() => import('./pages/public/Social'))
const Community = lazy(() => import('./pages/public/Community'))
const Collaborators = lazy(() => import('./pages/public/Collaborators'))
const Volunteer = lazy(() => import('./pages/public/Volunteer'))
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'))
const Search = lazy(() => import('./pages/public/Search'))
const NotFound = lazy(() => import('./pages/public/NotFound'))

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Onboarding = lazy(() => import('./pages/auth/Onboarding'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

const Dashboard = lazy(() => import('./pages/user/Dashboard'))
const Blueprint = lazy(() => import('./pages/user/Blueprint'))
const Score = lazy(() => import('./pages/user/Score'))
const UserProfile = lazy(() => import('./pages/user/UserProfile'))
const ResumeBuilder = lazy(() => import('./pages/user/ResumeBuilder'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageJobs = lazy(() => import('./pages/admin/ManageJobs'))
const ManageContent = lazy(() => import('./pages/admin/ManageContent'))
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'))
const ManageEducation = lazy(() => import('./pages/admin/ManageEducation'))
const ManageScholarships = lazy(() => import('./pages/admin/ManageScholarships'))
const ManageStructure = lazy(() => import('./pages/admin/ManageStructure'))
const ManageAbout = lazy(() => import('./pages/admin/ManageAbout'))
const ManageCommunity = lazy(() => import('./pages/admin/ManageCommunity'))
const ManageSocials = lazy(() => import('./pages/admin/ManageSocials'))
const ManageCollaborators = lazy(() => import('./pages/admin/ManageCollaborators'))
const ManageTeam = lazy(() => import('./pages/admin/ManageTeam'))
const ManageStats = lazy(() => import('./pages/admin/ManageStats'))
const UsersList = lazy(() => import('./pages/admin/UsersList'))
const ManageTeamMembers = lazy(() => import('./pages/admin/ManageTeamMembers'))
const ManagePayments = lazy(() => import('./pages/admin/ManagePayments'))
const AIInsights = lazy(() => import('./pages/admin/AIInsights'))
const MyProfile = lazy(() => import('./pages/admin/MyProfile'))
const ManageErrorLogs = lazy(() => import('./pages/admin/ManageErrorLogs'))
const ManageVolunteers = lazy(() => import('./pages/admin/ManageVolunteers'))
const ManagePopup = lazy(() => import('./pages/admin/ManagePopup'))
const ManageAnnouncement = lazy(() => import('./pages/admin/ManageAnnouncement'))

function Loader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
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
      <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={null}>
          <RadarCursor />
        </Suspense>
        <Suspense fallback={null}>
          <RadarAIBubble />
        </Suspense>
        <Suspense fallback={null}>
          <PopupModal />
        </Suspense>
        <Suspense fallback={null}>
          <AnnouncementPopup />
        </Suspense>
        <Suspense fallback={null}>
          <CookieConsentBanner />
        </Suspense>
        <Toaster position="bottom-center" />
        <ErrorBoundary>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            {/* PUBLIC */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/weekly-content" element={<WeeklyContent />} />
            <Route path="/education" element={<Education />} />
            <Route path="/scholarships" element={<Scholarships />} />
            <Route path="/products" element={<Products />} />
            <Route path="/shop" element={<Navigate to="/products" replace />} />
            <Route path="/team" element={<Team />} />
            <Route path="/structure" element={<Structure />} />
            <Route path="/about" element={<About />} />
            <Route path="/community" element={<Community />} />
            <Route path="/social" element={<Social />} />
            <Route path="/collaborators" element={<Collaborators />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/search" element={<Search />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* USER DASHBOARD */}
            <Route element={<UserRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/blueprint" element={<Blueprint />} />
                <Route path="/dashboard/score" element={<Score />} />
                <Route path="/dashboard/profile" element={<UserProfile />} />
                <Route path="/dashboard/resume" element={<ResumeBuilder />} />
                {/* Site pages within dashboard */}
                <Route path="/dashboard/jobs" element={<Jobs navless />} />
                <Route path="/dashboard/scholarships" element={<Scholarships navless />} />
                <Route path="/dashboard/education" element={<Education navless />} />
                <Route path="/dashboard/products" element={<Products navless />} />
                <Route path="/dashboard/resources" element={<WeeklyContent navless />} />
                <Route path="/dashboard/team" element={<Team navless />} />
                <Route path="/dashboard/about" element={<About navless />} />
                <Route path="/dashboard/community" element={<Community navless />} />
                <Route path="/dashboard/socials" element={<Social navless />} />
                <Route path="/dashboard/collaborators" element={<Collaborators navless />} />
                <Route path="/dashboard/structure" element={<Structure navless />} />
                <Route path="/dashboard/donate" element={<Donate />} />
              </Route>
            </Route>

            {/* ADMIN — all admin routes wrapped with AdminLayout for navbar + breadcrumbs */}
            <Route element={<AdminLayout />}>
              <Route element={<ProtectedRoute allowedRoles={["super_admin","admin"]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/manage-jobs" element={<ManageJobs />} />
                <Route path="/admin/manage-content" element={<ManageContent />} />
                <Route path="/admin/manage-products" element={<ManageProducts />} />
                <Route path="/admin/manage-education" element={<ManageEducation />} />
                <Route path="/admin/manage-scholarships" element={<ManageScholarships />} />
                <Route path="/admin/manage-about" element={<ManageAbout />} />
                <Route path="/admin/manage-community" element={<ManageCommunity />} />
                <Route path="/admin/manage-socials" element={<ManageSocials />} />
                <Route path="/admin/manage-collaborators" element={<ManageCollaborators />} />
              </Route>

              <Route element={<SuperAdminRoute />}>
                <Route path="/admin/manage-structure" element={<ManageStructure />} />
                <Route path="/admin/manage-stats" element={<ManageStats />} />
                <Route path="/admin/manage-team" element={<ManageTeam />} />
                <Route path="/admin/users-list" element={<UsersList />} />
                <Route path="/admin/manage-team-members" element={<ManageTeamMembers />} />
                <Route path="/admin/manage-payments" element={<ManagePayments />} />
                <Route path="/admin/ai-insights" element={<AIInsights />} />
                <Route path="/admin/error-logs" element={<ManageErrorLogs />} />
                <Route path="/admin/manage-volunteers" element={<ManageVolunteers />} />
                <Route path="/admin/manage-popup" element={<ManagePopup />} />
                <Route path="/admin/manage-announcement" element={<ManageAnnouncement />} />
              </Route>

              <Route element={<CollaboratorRoute />}>
                <Route path="/admin/my-profile" element={<MyProfile />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
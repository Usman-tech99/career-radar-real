import VolunteerForm from '../../components/VolunteerForm'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Helmet } from 'react-helmet-async'

export default function Volunteer() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Helmet>
        <title>Become a Volunteer — Career Radar</title>
        <meta name="description" content="Join Career Radar as a volunteer and help students build better careers." />
        <meta property="og:title" content="Become a Volunteer — Career Radar" />
        <meta property="og:description" content="Join Career Radar as a volunteer and help students build better careers." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="career radar volunteer, join us, community service, career development" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-24">
        <VolunteerForm />
      </main>
      <Footer />
    </div>
  )
}

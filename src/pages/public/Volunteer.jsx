import VolunteerForm from '../../components/VolunteerForm'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Helmet } from 'react-helmet-async'

export default function Volunteer() {
  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Helmet>
        <title>Become a Volunteer — Career Radar</title>
        <meta name="description" content="Join Career Radar as a volunteer and help students build better careers." />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-24">
        <VolunteerForm />
      </main>
      <Footer />
    </div>
  )
}

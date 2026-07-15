import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Helmet } from 'react-helmet-async'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Helmet>
        <title>Privacy Policy — Career Radar</title>
        <meta name="description" content="Career Radar privacy policy. Learn how we collect, use, and protect your personal data." />
        <meta property="og:title" content="Privacy Policy — Career Radar" />
        <meta property="og:description" content="Career Radar privacy policy. Learn how we collect, use, and protect your personal data." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Navbar />
      <main className="flex-1 pt-32 pb-20 px-4 max-w-4xl w-full mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold font-sora text-white mb-8">Privacy Policy</h1>
        <p className="text-muted mb-8">Last updated: July 2025</p>

        <section className="space-y-8 text-muted leading-relaxed">
          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">1. Introduction</h2>
            <p>Career Radar ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at www.career-radar.space.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold text-white mb-2">Personal Data</h3>
            <p>We may collect personally identifiable information such as your name, email address, phone number, educational background, and career interests when you register for an account, submit a form, or interact with our services.</p>
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Usage Data</h3>
            <p>We automatically collect certain information when you visit our site, including your IP address, browser type, operating system, referring URLs, and pages viewed. This helps us analyze trends and improve our platform.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">3. Cookies & Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors come from. Cookies are small text files stored on your device by your web browser.</p>
            <p className="mt-2">Types of cookies we use:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essential cookies:</strong> Required for the website to function properly (e.g., authentication, security).</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our site (e.g., Vercel Analytics, Sentry).</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences.</li>
            </ul>
            <p className="mt-2">You can control cookies through your browser settings. Disabling certain cookies may affect site functionality.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">4. How We Use Your Information</h2>
            <p>We use the collected data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, operate, and maintain our services</li>
              <li>Improve, personalize, and expand our platform</li>
              <li>Communicate with you, including updates, opportunities, and support</li>
              <li>Process applications for jobs, scholarships, internships, and volunteer roles</li>
              <li>Analyze usage patterns and optimize user experience</li>
              <li>Detect, prevent, and address technical issues and abuse</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase:</strong> Authentication, database, and storage</li>
              <li><strong>Vercel:</strong> Hosting and analytics</li>
              <li><strong>Cloudflare:</strong> CDN, DNS, and bot protection (Turnstile)</li>
              <li><strong>Groq:</strong> AI-powered career guidance (Radar AI)</li>
              <li><strong>Sentry:</strong> Error monitoring and crash reporting</li>
              <li><strong>Resend:</strong> Email delivery</li>
            </ul>
            <p className="mt-2">Each third-party provider has its own privacy policy governing the use of your data. We encourage you to review them.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">6. Data Sharing & Disclosure</h2>
            <p>We do not sell your personal information. We may share your data only:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>With service providers who perform functions on our behalf (as listed above)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">7. Data Retention</h2>
            <p>We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy, or as required by law. When you delete your account, we remove your profile and associated data from our active databases, though some information may be retained in backups or logs for a limited period.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access, update, or delete your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:careerradar.space@gmail.com" className="text-gold hover:underline">careerradar.space@gmail.com</a>.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">9. Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data, including encryption in transit (HTTPS), secure authentication, and regular security audits. However, no method of transmission or storage is 100% secure.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-sora text-white mb-3">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email: <a href="mailto:careerradar.space@gmail.com" className="text-gold hover:underline">careerradar.space@gmail.com</a></li>
              <li>Website: <a href="https://www.career-radar.space/about" className="text-gold hover:underline">www.career-radar.space/about</a></li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

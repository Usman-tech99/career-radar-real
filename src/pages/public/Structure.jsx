import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { Target, CheckCircle, Award, TrendingUp } from 'lucide-react'

export default function Structure({ navless } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStructure()
  }, [])

  async function fetchStructure() {
    const { data, error } = await supabase
      .from('structure_page')
      .select('*')
      .eq('id', 1)
      .single()

    if (!error && data) setData(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      {!navless && <Navbar />}
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="skeleton w-full h-96 rounded-2xl"></div>
        ) : !data ? (
          <div className="glass-card text-center py-20 text-muted">
            Structure information will be displayed here.
          </div>
        ) : (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-sora mb-6">Our <span className="text-green">Structure</span></h1>
              <div className="max-w-3xl mx-auto space-y-6">
                {data.aim && (
                  <div className="glass-card p-8 border-l-4 border-green">
                    <h2 className="text-xl font-bold text-green mb-2">Our Aim</h2>
                    <p className="text-lg text-white">{data.aim}</p>
                  </div>
                )}
                {data.mission && (
                  <div className="glass-card p-8 border-l-4 border-blue-accent">
                    <h2 className="text-xl font-bold text-blue-accent mb-2">Mission</h2>
                    <p className="text-lg text-white">{data.mission}</p>
                  </div>
                )}
                {data.vision && (
                  <div className="glass-card p-8 border-l-4 border-purple-accent">
                    <h2 className="text-xl font-bold text-purple-accent mb-2">Vision</h2>
                    <p className="text-lg text-white">{data.vision}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Core Values */}
            {data.core_values && data.core_values.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-center mb-8">Core Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {data.core_values.map((value, i) => (
                    <div key={i} className="glass-card p-6 text-center hover:-translate-y-1 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green" size={24} />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{value}</h3>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Goals */}
            {data.goals && data.goals.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-center mb-8">Our Goals</h2>
                <div className="glass-card p-8">
                  <div className="space-y-4">
                    {data.goals.map((goal, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center shrink-0 mt-1">
                          <CheckCircle size={14} className="text-[#07070C]" />
                        </div>
                        <p className="text-white">{goal}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Milestones */}
            {data.milestones && data.milestones.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold text-center mb-8">Milestones</h2>
                <div className="relative pl-8 space-y-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-border">
                  {data.milestones.map((milestone, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[34px] top-1 w-4 h-4 rounded-full bg-green border-4 border-[#07070C]"></div>
                      <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="text-gold" size={20} />
                          <span className="font-bold text-lg">{milestone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      {!navless && <Footer />}
    </div>
  )
}

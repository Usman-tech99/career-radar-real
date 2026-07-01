import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import SafeImage from '../../components/ui/SafeImage'
import { ShoppingBag, Download, ExternalLink, MessageCircle, DollarSign, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const [productsRes, educationRes] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('education_items').select('*').eq('is_published', true).order('created_at', { ascending: false })
    ])

    const merged = []

    if (!productsRes.error && productsRes.data) {
      merged.push(...productsRes.data.map(p => ({ ...p, _source: 'product' })))
    }

    if (!educationRes.error && educationRes.data) {
      const paidItems = educationRes.data.filter(e => !e.is_free && e.product_id)
      for (const edu of paidItems) {
        const existingProduct = merged.find(m => m.id === edu.product_id)
        if (!existingProduct) {
          merged.push({
            id: edu.product_id,
            title: edu.title,
            description: edu.description,
            category: edu.type || 'Course',
            thumbnail_url: edu.thumbnail_url,
            is_free: false,
            price_pkr: 0,
            whatsapp_number: null,
            bank_details: null,
            file_url: edu.free_access_url || null,
            external_link: null,
            _source: 'education',
            _edu_ref: edu.id,
          })
        }
      }
    }

    setProducts(merged)
    setLoading(false)
  }

  const filteredProducts = products.filter(product => 
    filterCategory === 'All' || product.category === filterCategory
  )

  const handlePurchaseClick = (product) => {
    if (product.is_free) {
      if (product.file_url) {
        window.open(product.file_url, '_blank')
      } else if (product.external_link) {
        window.open(product.external_link, '_blank')
      }
    } else {
      setSelectedProduct(product)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070C] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 max-w-7xl w-full mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-sora mb-4">Digital <span className="text-gold">Store</span></h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">Premium resources to accelerate your career. Free downloads and paid products available.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto mb-10 justify-center pb-2">
          {['All', 'File', 'Course', 'Template', 'eBook', 'Bundle'].map(category => (
            <button 
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                filterCategory === category ? 'bg-gold text-[#07070C]' : 'bg-white/[0.05] text-muted hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-white/[0.04]" />
                <div className="p-6 space-y-3">
                  <div className="h-5 w-20 rounded bg-white/[0.06]" />
                  <div className="h-5 w-full rounded bg-white/[0.06]" />
                  <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
                  <div className="h-4 w-full rounded bg-white/[0.06]" />
                  <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-6 w-16 rounded bg-white/[0.06]" />
                    <div className="h-6 w-12 rounded bg-white/[0.06]" />
                  </div>
                  <div className="h-10 w-full rounded-xl bg-white/[0.06] mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-card text-center py-20 text-muted">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="glass-card flex flex-col overflow-hidden hover:-translate-y-1 transition-transform group"
              >
                <div className="w-full h-48 relative overflow-hidden bg-black/50">
                  <SafeImage src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {product.is_free && (
                    <span className="absolute top-3 right-3 bg-green text-[#07070C] text-xs font-bold px-3 py-1 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold px-2 py-1 bg-gold/10 rounded">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors line-clamp-2">
                    {product.title}
                  </h3>
                  
                  <p className="text-sm text-muted mb-4 line-clamp-3 flex-1">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    {product.is_free ? (
                      <span className="text-green font-bold text-lg">Free</span>
                    ) : (
                      <span className="text-gold font-bold text-lg">Rs. {product.price_pkr?.toLocaleString()}</span>
                    )}
                    <button 
                      onClick={() => handlePurchaseClick(product)}
                      className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                    >
                      {product.is_free ? <Download size={14} /> : <DollarSign size={14} />}
                      {product.is_free ? 'Download' : 'Purchase'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Purchase Details</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-muted hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-border rounded-xl">
                <h3 className="font-bold text-lg mb-1">{selectedProduct.title}</h3>
                <p className="text-gold font-bold text-2xl">Rs. {selectedProduct.price_pkr?.toLocaleString()}</p>
              </div>

              {selectedProduct.whatsapp_number && (
                <div className="p-4 bg-green/5 border border-green/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="text-green" size={20} />
                    <span className="font-bold">WhatsApp Payment</span>
                  </div>
                  <p className="text-sm text-muted mb-2">Send payment screenshot to:</p>
                  <p className="text-green font-bold text-lg">{selectedProduct.whatsapp_number}</p>
                </div>
              )}

              {selectedProduct.bank_details && (
                <div className="p-4 bg-blue-accent/5 border border-blue-accent/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="text-blue-accent" size={20} />
                    <span className="font-bold">Bank Transfer</span>
                  </div>
                  <pre className="text-sm text-muted whitespace-pre-wrap">{selectedProduct.bank_details}</pre>
                </div>
              )}

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <h4 className="font-bold text-amber-400 mb-2">Payment Instructions:</h4>
                <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
                  <li>Send payment via WhatsApp or Bank Transfer</li>
                  <li>Screenshot your payment confirmation</li>
                  <li>Send screenshot to the WhatsApp number above</li>
                  <li>You'll receive the download link within 24 hours</li>
                </ol>
              </div>

              <button 
                onClick={() => {
                  if (selectedProduct.whatsapp_number) {
                    window.open(`https://wa.me/${selectedProduct.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank')
                  }
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Contact on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

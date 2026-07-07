import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, FileLock2, Trash2 } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

export default function ManagePayments() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('delivered_orders')
      .select('*, products(file_url, title)')
      .order('created_at', { ascending: false })

    if (error) toast.error('Failed to fetch orders')
    else setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('delivered_orders').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Order marked as ${status}`)
      fetchOrders()
    }
  }

  async function generateSignedUrl(productPath, orderId) {
    if (!productPath) {
      toast.error('This product does not have a private file attached.')
      return
    }

    // Generate signed URL valid for 7 days (604800 seconds)
    const { data, error } = await supabase.storage
      .from('product-files')
      .createSignedUrl(productPath, 604800)

    if (error) {
      toast.error(error.message)
      return
    }

    // Save signed url temporarily in the order notes or copy to clipboard
    navigator.clipboard.writeText(data.signedUrl)
    toast.success('Signed URL copied to clipboard! Sent this to the buyer.')
    
    // Auto mark as delivered
    updateStatus(orderId, 'delivered')
  }

  async function deleteOrder(id) {
    if (!window.confirm('Delete this order record?')) return
    const { error } = await supabase.from('delivered_orders').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Deleted')
      fetchOrders()
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">Manage Payments</h1>
            <p className="text-muted text-sm mt-1">Super Admin only. Verify manual payments and deliver digital products.</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton w-full h-64 rounded-2xl"></div>
        ) : orders.length === 0 ? (
          <div className="glass-card text-center py-12 text-muted">No manual orders found.</div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-[#94A3B8] font-medium">Order Details</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Buyer Info</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Payment</th>
                  <th className="p-4 text-[#94A3B8] font-medium">Status</th>
                  <th className="p-4 text-right text-[#94A3B8] font-medium">Delivery Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="font-bold">{order.product_title}</div>
                      <div className="text-xs text-muted">{formatDate(order.created_at)}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{order.buyer_name}</div>
                      <div className="text-sm text-blue-400">{order.buyer_whatsapp}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green">PKR {order.amount_pkr}</div>
                      <div className="text-xs text-muted">{order.payment_method}</div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-sm px-3 py-1 border-none bg-white/[0.05] rounded-full outline-none font-bold ${
                          order.status === 'pending' ? 'text-amber-400' :
                          order.status === 'confirmed' ? 'text-blue-400' :
                          order.status === 'delivered' ? 'text-green' :
                          'text-red-400'
                        }`}
                      >
                        <option value="pending" className="text-black">Pending</option>
                        <option value="confirmed" className="text-black">Confirmed</option>
                        <option value="delivered" className="text-black">Delivered</option>
                        <option value="rejected" className="text-black">Rejected</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-y-2">
                      <button 
                        onClick={() => generateSignedUrl(order.products?.file_url, order.id)}
                        className="btn-primary py-1.5 px-3 text-sm flex items-center justify-center gap-2 w-full"
                      >
                        <FileLock2 size={16} /> Gen Link
                      </button>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="btn-ghost text-red-500 hover:text-red-400 hover:bg-red-500/10 py-1.5 px-3 text-sm flex items-center justify-center gap-2 w-full border border-red-500/20"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}

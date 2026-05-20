import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser } from '~/redux/userSlice'
import { orderAPI } from '~/apis'
import { toast } from 'react-toastify'

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
const formatDate = (d) => new Date(d).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })

// Cấu hình trạng thái đơn hàng
const STATUS_CONFIG = {
  pending:          { label: 'Đơn hàng mới',            icon: '🆕', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',   step: 1 },
  confirmed:        { label: 'Đã xác nhận',             icon: '✅', color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200',   dot: 'bg-teal-500',   step: 2 },
  preparing:        { label: 'Shop đang chuẩn bị hàng', icon: '📦', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',  step: 3 },
  shipping:         { label: 'Đang giao hàng',          icon: '🚚', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', step: 4 },
  delivered:        { label: 'Đã giao thành công',      icon: '🎉', color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500',step: 5 },
  cancelled:        { label: 'Đã hủy',                  icon: '❌', color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200',   dot: 'bg-rose-500',   step: 0 },
  cancel_requested: { label: 'Yêu cầu hủy đang xử lý', icon: '⚠️', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400', step: 0 },
}

const STEPS = [
  { key: 'pending',   label: 'Đặt hàng',       icon: '🆕' },
  { key: 'confirmed', label: 'Xác nhận',        icon: '✅' },
  { key: 'preparing', label: 'Chuẩn bị',        icon: '📦' },
  { key: 'shipping',  label: 'Đang giao',       icon: '🚚' },
  { key: 'delivered', label: 'Đã giao',         icon: '🎉' },
]

// ── Countdown timer cho cancel deadline ──
const CancelCountdown = ({ seconds }) => {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) return
    const t = setInterval(() => setLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [])
  if (left <= 0) return <span className="text-rose-500 font-semibold text-xs">Hết thời gian hủy</span>
  const m = Math.floor(left / 60), s = left % 60
  return (
    <span className="text-amber-600 font-bold text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
      ⏱ Còn {m}:{String(s).padStart(2, '0')} để hủy đơn
    </span>
  )
}

// ── Order Status Badge ──
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Order Card (in list) ──
const OrderCard = ({ order, onClick }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  return (
    <div onClick={() => onClick(order.id)}
      className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">Đơn hàng #{order.id} • {formatDate(order.created_at)}</p>
          <StatusBadge status={order.status} />
        </div>
        <div className="text-right">
          <p className="font-extrabold text-indigo-600 text-base">{formatPrice(order.final_amount)}</p>
          <p className="text-xs text-gray-400">{order.item_count} sản phẩm</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 truncate">{order.product_summary || '—'}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className="text-xs text-gray-500">{order.payment_method?.toUpperCase()}</span>
        </div>
        <span className="text-xs text-indigo-500 font-semibold">Xem chi tiết →</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  ORDER DETAIL VIEW
// ══════════════════════════════════════════════════════════════════
const OrderDetail = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const res = await orderAPI.getOrderDetailAPI(orderId)
      if (res.status === 'success') setOrder(res.data)
    } catch { toast.error('Không thể tải đơn hàng') }
    finally { setLoading(false) }
  }, [orderId])

  useEffect(() => { fetch() }, [fetch])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await orderAPI.cancelOrderAPI(orderId, cancelReason)
      if (res.status === 'success') {
        toast.success(res.message)
        setCancelModal(false)
        fetch() // refresh
      } else { toast.error(res.message) }
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi hủy đơn') }
    finally { setCancelling(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  )
  if (!order) return <div className="text-center py-16 text-gray-400">Không tìm thấy đơn hàng</div>

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const currentStep = cfg.step
  const canCancel = ['pending', 'confirmed'].includes(order.status) && order.cancelTimeLeft > 0
  const canRequestCancel = order.status === 'preparing'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:border-indigo-300 transition">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Đơn hàng #{order.id}</h2>
          <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress timeline */}
      {!['cancelled', 'cancel_requested'].includes(order.status) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div className="flex items-start">
            {STEPS.map((s, i) => {
              const done = currentStep > i + 1
              const active = currentStep === i + 1
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && <div className={`flex-1 h-1 ${done || (active && i > 0) ? 'bg-indigo-400' : 'bg-gray-200'} transition-all duration-500`} />}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300 flex-shrink-0
                      ${done ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200' :
                        active ? 'bg-white border-indigo-600 shadow-md shadow-indigo-100' :
                        'bg-white border-gray-200'}`}>
                      {done ? '✓' : s.icon}
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-1 ${done ? 'bg-indigo-400' : 'bg-gray-200'} transition-all duration-500`} />}
                  </div>
                  <p className={`text-xs mt-2 font-semibold text-center ${active ? 'text-indigo-600' : done ? 'text-gray-600' : 'text-gray-300'}`}>{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cancel/request cancel buttons */}
      {(canCancel || canRequestCancel) && (
        <div className="mb-4 flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div>
            {canCancel && <CancelCountdown seconds={order.cancelTimeLeft} />}
            {canRequestCancel && <span className="text-orange-600 text-sm font-semibold">Đơn đang chuẩn bị — có thể gửi yêu cầu hủy</span>}
          </div>
          <button onClick={() => setCancelModal(true)}
            className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-200 transition border border-rose-200">
            {canRequestCancel ? 'Yêu cầu hủy' : 'Hủy đơn'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-extrabold text-gray-800 mb-4 text-sm uppercase tracking-wide">Sản phẩm đã đặt</h3>
            <div className="space-y-3">
              {(order.items || []).map(item => (
                <div key={item.id} className="flex gap-3 items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <img src={item.product_image || 'https://placehold.co/60x60?text=No'} alt={item.product_name}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                    onError={e => { e.target.src = 'https://placehold.co/60x60?text=No' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-2">{item.product_name}</p>
                    <p className="text-xs text-gray-400">{item.brand}{item.size ? ` • Size ${item.size}` : ''} • x{item.quantity}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.price)} / cái</p>
                  </div>
                  <p className="font-extrabold text-indigo-600 text-sm flex-shrink-0">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>Tạm tính</span><span>{formatPrice(order.total_amount)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Phí vận chuyển</span>
                <span className={order.shipping_fee == 0 ? 'text-emerald-600 font-bold' : ''}>{order.shipping_fee == 0 ? 'Miễn phí' : formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-gray-900 pt-2 border-t border-gray-100">
                <span>Tổng cộng</span><span className="text-indigo-600">{formatPrice(order.final_amount)}</span>
              </div>
            </div>
          </div>

          {/* Status history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-extrabold text-gray-800 mb-4 text-sm uppercase tracking-wide">Lịch sử trạng thái</h3>
            <div className="space-y-3">
              {(order.statusHistory || []).map((h, i) => {
                const hCfg = STATUS_CONFIG[h.status] || {}
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${hCfg.dot || 'bg-gray-300'}`} />
                      {i < order.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-bold text-gray-800">{hCfg.icon} {hCfg.label || h.status}</p>
                      {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order info sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-extrabold text-gray-800 mb-4 text-sm uppercase tracking-wide">Thông tin giao hàng</h3>
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-gray-400">Người nhận</p><p className="font-semibold text-gray-800">{order.receiver_name}</p></div>
              <div><p className="text-xs text-gray-400">Số điện thoại</p><p className="font-semibold text-gray-800">{order.receiver_phone}</p></div>
              <div><p className="text-xs text-gray-400">Địa chỉ</p><p className="font-semibold text-gray-800">{order.shipping_address}</p></div>
              <div><p className="text-xs text-gray-400">Thanh toán</p>
                <p className="font-bold text-indigo-600">{order.payment_method?.toUpperCase()}</p>
              </div>
              {order.notes && <div><p className="text-xs text-gray-400">Ghi chú</p><p className="text-gray-700">{order.notes}</p></div>}
              {order.cancel_reason && <div><p className="text-xs text-rose-400">Lý do hủy</p><p className="text-rose-600 font-semibold">{order.cancel_reason}</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">
              {canRequestCancel ? '⚠️ Gửi yêu cầu hủy đơn' : '❌ Hủy đơn hàng'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {canRequestCancel
                ? 'Đơn hàng đang được chuẩn bị. Yêu cầu hủy sẽ được shop xem xét.'
                : 'Thao tác này không thể hoàn tác. Bạn có chắc muốn hủy?'}
            </p>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm mb-4 resize-none"
              rows={3} placeholder="Lý do hủy đơn..."
              value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">Đóng</button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition disabled:opacity-70 flex items-center justify-center gap-2">
                {cancelling ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {canRequestCancel ? 'Gửi yêu cầu' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  ORDERS PAGE (LIST)
// ══════════════════════════════════════════════════════════════════
const OrdersPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { orderId } = useParams() // optional — if viewing detail
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderAPI.getMyOrdersAPI()
      if (res.status === 'success') setOrders(res.data)
    } catch { toast.error('Không thể tải đơn hàng') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleLogout = () => { dispatch(clearUser()); navigate('/login') }

  const TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'active', label: 'Đang xử lý' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ]

  const filteredOrders = orders.filter(o => {
    if (tab === 'all') return true
    if (tab === 'active') return ['pending', 'confirmed', 'preparing', 'shipping', 'cancel_requested'].includes(o.status)
    if (tab === 'delivered') return o.status === 'delivered'
    if (tab === 'cancelled') return o.status === 'cancelled'
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SN</span>
            </div>
            <span className="text-xl font-black text-gray-800 hidden sm:block">Sneak<span className="text-indigo-600">Peak</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/cart')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden md:block">Giỏ hàng</button>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold transition">Đăng xuất</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-16">
        {orderId ? (
          <OrderDetail orderId={orderId} onBack={() => navigate('/orders')} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900">📋 Đơn hàng của tôi</h1>
              <button onClick={() => navigate('/shop')} className="text-sm text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1">
                🛍️ Tiếp tục mua sắm
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.key ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-indigo-600'}`}>
                  {t.label}
                  {t.key !== 'all' && (
                    <span className="ml-1.5 text-xs">
                      ({orders.filter(o => {
                        if (t.key === 'active') return ['pending', 'confirmed', 'preparing', 'shipping', 'cancel_requested'].includes(o.status)
                        if (t.key === 'delivered') return o.status === 'delivered'
                        if (t.key === 'cancelled') return o.status === 'cancelled'
                        return false
                      }).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex justify-between mb-3"><div className="h-4 bg-gray-200 rounded w-40" /><div className="h-5 bg-gray-200 rounded w-24" /></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <p className="text-5xl mb-3">📭</p>
                <h3 className="text-lg font-bold text-gray-700">Không có đơn hàng nào</h3>
                <button onClick={() => navigate('/shop')} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">Mua sắm ngay</button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
                  <OrderCard key={order.id} order={order} onClick={(id) => navigate(`/orders/${id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default OrdersPage

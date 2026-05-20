import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser } from '~/redux/userSlice'
import { cartAPI } from '~/apis'
import { toast } from 'react-toastify'

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

const CartPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userInfo } = useSelector(s => s.user)
  const [cart, setCart] = useState({ items: [], totalAmount: 0, shippingFee: 30000, finalAmount: 0, itemCount: 0 })
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchCart = async () => {
    try {
      const res = await cartAPI.getCartAPI()
      if (res.status === 'success') setCart(res.data)
    } catch { toast.error('Không thể tải giỏ hàng') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCart() }, [])

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return handleRemove(itemId)
    setUpdatingId(itemId)
    try {
      const res = await cartAPI.updateCartItemAPI(itemId, newQty)
      if (res.status === 'success') {
        setCart(prev => ({
          ...prev,
          items: res.data.items,
          totalAmount: res.data.totalAmount,
          itemCount: res.data.itemCount,
          shippingFee: res.data.totalAmount >= 500000 ? 0 : 30000,
          finalAmount: res.data.totalAmount + (res.data.totalAmount >= 500000 ? 0 : 30000)
        }))
      }
    } catch { toast.error('Lỗi cập nhật') }
    finally { setUpdatingId(null) }
  }

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId)
    try {
      await cartAPI.removeCartItemAPI(itemId)
      toast.success('Đã xoá khỏi giỏ hàng')
      fetchCart()
    } catch { toast.error('Lỗi xoá sản phẩm') }
    finally { setUpdatingId(null) }
  }

  const handleClear = async () => {
    if (!confirm('Xoá toàn bộ giỏ hàng?')) return
    await cartAPI.clearCartAPI()
    fetchCart()
    toast.info('Đã xoá giỏ hàng')
  }

  const handleLogout = () => { dispatch(clearUser()); navigate('/login') }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Đang tải giỏ hàng...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SN</span>
            </div>
            <span className="text-xl font-black text-gray-800 hidden sm:block">Sneak<span className="text-indigo-600">Peak</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden md:block">Trang chủ</button>
            <button onClick={() => navigate('/shop')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden md:block">Cửa hàng</button>
            <button onClick={() => navigate('/orders')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden md:block">Đơn hàng</button>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold transition">Đăng xuất</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">🛒 Giỏ hàng</h1>
            <p className="text-gray-500 text-sm mt-1">{cart.itemCount} sản phẩm trong giỏ</p>
          </div>
          {cart.items.length > 0 && (
            <button onClick={handleClear} className="text-sm text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Xoá tất cả
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          // Empty state
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-7xl mb-4">🛒</p>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-400 mb-6">Hãy thêm sản phẩm yêu thích của bạn!</p>
            <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition shadow-lg">
              Tiếp tục mua sắm →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map(item => {
                const isUpdating = updatingId === item.id
                return (
                  <div key={item.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 transition-all ${isUpdating ? 'opacity-60' : ''}`}>
                    <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 cursor-pointer" onClick={() => navigate(`/product/${item.slug}`)}>
                      <img src={item.image || 'https://placehold.co/200x200?text=No'} alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.src = 'https://placehold.co/200x200?text=No' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-indigo-500 font-bold uppercase">{item.brand}</p>
                          <h3 className="font-bold text-gray-800 text-sm line-clamp-2 cursor-pointer hover:text-indigo-600 transition" onClick={() => navigate(`/product/${item.slug}`)}>{item.name}</h3>
                          {item.size && <p className="text-xs text-gray-400 mt-0.5">Size: <span className="font-semibold">{item.size}</span></p>}
                        </div>
                        <button onClick={() => handleRemove(item.id)} disabled={isUpdating}
                          className="text-gray-300 hover:text-rose-500 transition flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        {/* Qty control */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1">
                          <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow transition text-gray-600 font-bold disabled:opacity-50">−</button>
                          <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                          <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} disabled={isUpdating || item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow transition text-gray-600 font-bold disabled:opacity-50">+</button>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-indigo-600">{formatPrice(item.final_price * item.quantity)}</p>
                          {item.discount_percent > 0 && (
                            <p className="text-xs text-gray-400">{formatPrice(item.price)} × {item.quantity}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
                <h3 className="text-lg font-extrabold text-gray-800 mb-5">Tóm tắt đơn hàng</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính ({cart.itemCount} sản phẩm)</span>
                    <span>{formatPrice(cart.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    {cart.shippingFee === 0
                      ? <span className="text-emerald-600 font-bold">Miễn phí</span>
                      : <span>{formatPrice(cart.shippingFee)}</span>
                    }
                  </div>
                  {cart.totalAmount < 500000 && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                      💡 Mua thêm <strong>{formatPrice(500000 - cart.totalAmount)}</strong> để miễn phí vận chuyển
                    </p>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-lg text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-indigo-600">{formatPrice(cart.finalAmount)}</span>
                  </div>
                </div>
                <button onClick={() => navigate('/checkout')}
                  className="mt-6 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition shadow-lg shadow-indigo-200 hover:shadow-indigo-300 text-base">
                  Đặt hàng ngay →
                </button>
                <button onClick={() => navigate('/shop')}
                  className="mt-3 w-full py-2.5 bg-white text-gray-600 rounded-xl font-semibold border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition text-sm">
                  ← Tiếp tục mua sắm
                </button>
              </div>

              {/* Payment badges */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Chấp nhận thanh toán</p>
                <div className="grid grid-cols-3 gap-2">
                  {['💵 COD', '📱 MoMo', '💙 ZaloPay'].map(m => (
                    <div key={m} className="text-center py-2 px-1 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 border border-gray-100">{m}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CartPage

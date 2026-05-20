import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { cartAPI, orderAPI } from '~/apis'
import { toast } from 'react-toastify'

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

const PAYMENT_METHODS = [
  { key: 'cod', label: 'Thanh toán khi nhận hàng', sub: 'COD — Bắt buộc', icon: '💵', required: true },
  { key: 'momo', label: 'Ví MoMo', sub: 'Thanh toán qua ví điện tử MoMo', icon: '📱', required: false },
  { key: 'zalopay', label: 'ZaloPay', sub: 'Thanh toán qua ví ZaloPay', icon: '💙', required: false },
]

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { userInfo } = useSelector(s => s.user)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [form, setForm] = useState({
    receiverName: userInfo?.full_name || '',
    receiverPhone: userInfo?.phone_number || '',
    shippingAddress: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1) // 1=info, 2=payment, 3=confirm

  useEffect(() => {
    cartAPI.getCartAPI().then(res => {
      if (res.status === 'success') {
        if (res.data.items.length === 0) { navigate('/cart'); return }
        setCart(res.data)
      }
    }).finally(() => setLoading(false))
  }, [])

  const validate = () => {
    const e = {}
    if (!form.receiverName.trim()) e.receiverName = 'Vui lòng nhập tên người nhận'
    if (!form.receiverPhone.trim() || !/^[0-9]{9,11}$/.test(form.receiverPhone.replace(/\s/g, '')))
      e.receiverPhone = 'Số điện thoại không hợp lệ'
    if (!form.shippingAddress.trim()) e.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await orderAPI.createOrderAPI({
        ...form, paymentMethod, useCartItems: true
      })
      if (res.status === 'success') {
        toast.success('🎉 Đặt hàng thành công!')
        navigate(`/orders/${res.data.orderId}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!cart) return null

  const shippingFee = cart.totalAmount >= 500000 ? 0 : 30000
  const finalAmount = cart.totalAmount + shippingFee

  // Progress steps
  const steps = ['Thông tin giao hàng', 'Phương thức TT', 'Xác nhận']
  const inputCls = (field) => `w-full px-4 py-3 rounded-xl border ${errors[field] ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'} focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-gray-800 transition`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-semibold text-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Quay lại giỏ hàng
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">SN</span>
            </div>
            <span className="text-lg font-black text-gray-800">Sneak<span className="text-indigo-600">Peak</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Thanh toán đơn hàng</h1>

        {/* Progress bar */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-indigo-600' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${i + 1 < step ? 'bg-indigo-600 border-indigo-600 text-white' :
                    i + 1 === step ? 'border-indigo-600 text-indigo-600 bg-white' :
                    'border-gray-200 text-gray-300 bg-white'}`}>
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-indigo-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form area */}
          <div className="lg:col-span-3">
            {/* Step 1: Thông tin giao hàng */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black">1</span>
                  Thông tin giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">Họ tên người nhận *</label>
                    <input className={inputCls('receiverName')} placeholder="Nguyễn Văn A"
                      value={form.receiverName} onChange={e => setForm({ ...form, receiverName: e.target.value })} />
                    {errors.receiverName && <p className="text-xs text-rose-500 mt-1">{errors.receiverName}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">Số điện thoại *</label>
                    <input className={inputCls('receiverPhone')} placeholder="0901234567"
                      value={form.receiverPhone} onChange={e => setForm({ ...form, receiverPhone: e.target.value })} />
                    {errors.receiverPhone && <p className="text-xs text-rose-500 mt-1">{errors.receiverPhone}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">Địa chỉ giao hàng *</label>
                    <textarea className={inputCls('shippingAddress')} rows={3}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      value={form.shippingAddress} onChange={e => setForm({ ...form, shippingAddress: e.target.value })} />
                    {errors.shippingAddress && <p className="text-xs text-rose-500 mt-1">{errors.shippingAddress}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1.5 block">Ghi chú đơn hàng</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-gray-800" rows={2}
                      placeholder="Ghi chú cho người bán (không bắt buộc)"
                      value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <button onClick={() => { if (validate()) setStep(2) }}
                  className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition">
                  Tiếp theo →
                </button>
              </div>
            )}

            {/* Step 2: Phương thức thanh toán */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black">2</span>
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.key}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${paymentMethod === m.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                      <input type="radio" name="payment" value={m.key}
                        checked={paymentMethod === m.key}
                        onChange={() => setPaymentMethod(m.key)}
                        className="w-4 h-4 text-indigo-600" />
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-800">{m.label}</p>
                          {m.required && <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">Bắt buộc</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{m.sub}</p>
                      </div>
                      {paymentMethod === m.key && (
                        <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
                {paymentMethod === 'momo' && (
                  <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-xl text-sm text-pink-700">
                    📱 <strong>Lưu ý:</strong> Thanh toán MoMo sẽ được xử lý sau khi đặt hàng. Nhân viên sẽ liên hệ hướng dẫn.
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">← Quay lại</button>
                  <button onClick={() => setStep(3)} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition">Xem lại đơn →</button>
                </div>
              </div>
            )}

            {/* Step 3: Xác nhận */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black">3</span>
                  Xác nhận đơn hàng
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                    <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Người nhận:</span><span className="font-semibold text-gray-800">{form.receiverName}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">SĐT:</span><span className="font-semibold text-gray-800">{form.receiverPhone}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Địa chỉ:</span><span className="font-semibold text-gray-800">{form.shippingAddress}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Thanh toán:</span>
                      <span className="font-semibold text-indigo-600">{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</span>
                    </div>
                    {form.notes && <div className="flex gap-2"><span className="text-gray-500 w-24 flex-shrink-0">Ghi chú:</span><span className="text-gray-700">{form.notes}</span></div>}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sản phẩm ({cart.itemCount})</p>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {cart.items.map(item => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <img src={item.image || 'https://placehold.co/60x60?text=No'} alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                            onError={e => { e.target.src = 'https://placehold.co/60x60?text=No' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-400">x{item.quantity}{item.size ? ` • Size ${item.size}` : ''}</p>
                          </div>
                          <p className="font-bold text-indigo-600 text-sm">{formatPrice(item.final_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">← Quay lại</button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>
                    ) : '✅ Xác nhận đặt hàng'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h3 className="font-extrabold text-gray-800 mb-4 text-sm uppercase tracking-wide">Đơn hàng của bạn</h3>
              <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative">
                      <img src={item.image || 'https://placehold.co/50x50?text=No'} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                        onError={e => { e.target.src = 'https://placehold.co/50x50?text=No' }} />
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center w-5 h-5">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2">{item.name}</p>
                      {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                    </div>
                    <p className="text-sm font-bold text-gray-700">{formatPrice(item.final_price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span><span>{formatPrice(cart.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Vận chuyển</span>
                  <span className={shippingFee === 0 ? 'text-emerald-600 font-bold' : ''}>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-indigo-600">{formatPrice(finalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CheckoutPage

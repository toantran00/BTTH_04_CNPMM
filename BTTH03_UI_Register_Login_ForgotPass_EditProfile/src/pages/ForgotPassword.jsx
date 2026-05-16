import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { authAPI } from '~/apis'
import { setLoading } from '~/redux/userSlice'

const ForgotPassword = () => {
  const dispatch = useDispatch()
  const loading = useSelector(state => state.user.loading)

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    dispatch(setLoading(true))
    try {
      const res = await authAPI.forgotPasswordAPI(email)
      toast.success(res.message)
      setStep(2)
    } catch (error) {
      console.error('Request OTP Error:', error)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    dispatch(setLoading(true))
    try {
      const res = await authAPI.resetPasswordAPI({ email, otp, newPassword })
      toast.success(res.message)
      window.location.href = '/login'
    } catch (error) {
      console.error('Reset Password Error:', error)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none mb-4 transition-all'
  const btnClass = 'w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50'

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-orange-400 to-rose-500 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Khôi phục mật khẩu</h2>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <p className="text-gray-500 text-sm mb-6 text-center">Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.</p>
            <input type="email" placeholder="Email của bạn" className={inputClass} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading} className={`${btnClass} bg-orange-500 hover:bg-orange-600`}>
              {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Mã OTP 6 số" className={`${inputClass} text-center tracking-widest`} required />
            <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" className={inputClass} required />
            <button type="submit" disabled={loading} className={`${btnClass} bg-rose-500 hover:bg-rose-600`}>
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu mới'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-gray-500 hover:text-orange-600 font-medium"> Quay lại đăng nhập</a>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
const userRepository = require('../repositories/userRepository')

const verifyOTP = async (email, otp) => {
  const user = await userRepository.findByEmail(email)
  const normalizedOtp = String(otp || '').trim()

  if (!user) {
    const error = new Error('Người dùng không tồn tại')
    error.statusCode = 404
    throw error
  }

  if (user.is_active) {
    const error = new Error('Tài khoản đã được kích hoạt, vui lòng đăng nhập')
    error.statusCode = 400
    throw error
  }

  // 1. Kiểm tra OTP có khớp không
  if (String(user.otp_code || '').trim() !== normalizedOtp) {
    const error = new Error('Mã OTP không chính xác')
    error.statusCode = 400
    throw error
  }

  // 2. Kiểm tra OTP còn hạn không
  if (new Date() > new Date(user.otp_expires_at)) {
    const error = new Error('Mã OTP đã hết hạn')
    error.statusCode = 400
    throw error
  }

  // 3. Kích hoạt tài khoản
  return await userRepository.updateActivationStatus(email)
}

module.exports = { verifyOTP }

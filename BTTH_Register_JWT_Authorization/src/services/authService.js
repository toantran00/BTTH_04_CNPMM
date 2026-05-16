const userRepository = require('../repositories/userRepository')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const login = async (email, password) => {
  // 1. Kiểm tra user có tồn tại không
  const user = await userRepository.findByEmail(email)
  if (!user) {
    const error = new Error('Email hoặc mật khẩu không chính xác')
    error.statusCode = 401
    throw error
  }

  // 2. Kiểm tra tài khoản đã kích hoạt chưa
  if (!user.is_active) {
    const error = new Error('Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.')
    error.statusCode = 403
    throw error
  }

  // 3. So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    const error = new Error('Email hoặc mật khẩu không chính xác')
    error.statusCode = 401
    throw error
  }

  // 4. Tạo JWT Token
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name, 
      phone_number: user.phone_number
    }
  }
}

module.exports = { login }
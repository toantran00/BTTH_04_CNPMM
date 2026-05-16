const db = require('../config/db')

const userRepository = {
  findByEmail: async (email) => {
    const [rows] = await db.execute(
    'SELECT id, username, email, password, role, is_active, full_name, phone_number, otp_code, otp_expires_at FROM users WHERE email = ?',
    [email]
  )
    return rows[0]
  },

  updateActivationStatus: async (email) => {
    const query = 'UPDATE users SET is_active = true, otp_code = NULL, otp_expires_at = NULL WHERE email = ?'
    const [result] = await db.execute(query, [email])
    return result
  },

  updateOTPByEmail: async (email, otp, expiresAt) => {
    const query = 'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?'
    const [result] = await db.execute(query, [otp, expiresAt, email])
    return result
  },

  resetPassword: async (email, hashedPassword) => {
    const query = 'UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE email = ?'
    const [result] = await db.execute(query, [hashedPassword, email])
    return result
  },

  updateProfile: async (id, data) => {
    const { username, full_name, phone_number, password } = data
    // Câu lệnh SQL linh hoạt: Nếu có password mới thì cập nhật, không thì giữ nguyên
    const query = `
      UPDATE users 
      SET username = ?, full_name = ?, phone_number = ?, password = ? 
      WHERE id = ?
    `
    const [result] = await db.execute(query, [username, full_name, phone_number, password, id])
    return result
  },

  findById: async (id) => {
    const query = 'SELECT id, username, email, role, full_name, phone_number, password FROM users WHERE id = ?'
    const [rows] = await db.execute(query, [id])
    return rows[0]
  },

  savePendingUser: async (userData, otp, expiresAt) => {
    const query = `
      INSERT INTO users (username, email, password, otp_code, otp_expires_at, is_active, role) 
      VALUES (?, ?, ?, ?, ?, false, 'user')
    `
    const values = [userData.username, userData.email, userData.password, otp, expiresAt]
    const [result] = await db.execute(query, values)
    return result
  }
}

module.exports = userRepository

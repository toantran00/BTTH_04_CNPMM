const userRepository = require('../repositories/userRepository')
const bcrypt = require('bcrypt')

const getUserById = async (userId) => {
  const user = await userRepository.findById(userId)
  if (!user) {
    const error = new Error('Người dùng không tồn tại')
    error.statusCode = 404
    throw error
  }
  return user
}

const updateUserInfo = async (userId, updateData) => {
  // 1. Lấy thông tin hiện tại của user để giữ lại các trường không thay đổi
  const currentUser = await userRepository.findById(userId)
  if (!currentUser) throw new Error('Người dùng không tồn tại')

  // 2. Chuẩn bị dữ liệu mới (nếu client không gửi trường nào thì giữ lại giá trị cũ)
  const finalData = {
    username: updateData.username || currentUser.username,
    full_name: updateData.full_name || currentUser.full_name,
    phone_number: updateData.phone_number || currentUser.phone_number,
    password: currentUser.password // Mặc định dùng pass cũ
  }

  // 3. Nếu có mật khẩu mới, hãy mã hóa nó
  if (updateData.password && updateData.password.trim() !== '') {
    const salt = await bcrypt.genSalt(8)
    finalData.password = await bcrypt.hash(updateData.password, salt)
  }

  return await userRepository.updateProfile(userId, finalData)
}

module.exports = { updateUserInfo, getUserById }
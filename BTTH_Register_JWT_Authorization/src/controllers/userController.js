const userService = require('../services/userService')

const handleUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id 
    const updateData = req.body
    // 1. Thực hiện cập nhật
    await userService.updateUserInfo(userId, updateData)

    // 2. QUAN TRỌNG: Lấy lại thông tin user mới nhất từ DB sau khi đã update
    const updatedUser = await userService.getUserById(userId)

    // 3. Trả về kèm theo dữ liệu user mới
    res.status(200).json({
      status: 'success',
      message: 'Cập nhật thông tin cá nhân thành công!',
      data: {
        user: updatedUser 
      }
    })
  } catch (error) {
    console.error('Update Profile Error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}

module.exports = { handleUpdateProfile }
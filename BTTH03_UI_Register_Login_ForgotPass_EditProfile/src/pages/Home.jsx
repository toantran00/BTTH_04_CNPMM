import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser, updateUser, setLoading } from '~/redux/userSlice'
import { authAPI } from '~/apis'
import { toast } from 'react-toastify'

const Home = () => {
  const dispatch = useDispatch()
  const { userInfo, loading } = useSelector((state) => state.user)

  const [isEditing, setIsEditing] = useState(false)

  // Khởi tạo state với đầy đủ các trường mới
  const [formData, setFormData] = useState({
    username: userInfo?.username || '',
    full_name: userInfo?.full_name || '',
    phone_number: userInfo?.phone_number || ''
  })

  const handleLogout = () => {
    dispatch(clearUser())
    toast.info('Đã đăng xuất!')
    window.location.href = '/login'
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    dispatch(setLoading(true))
    try {
      // Gửi toàn bộ formData lên Backend
      const res = await authAPI.updateProfileAPI(formData)

      // Cập nhật Redux & LocalStorage
      if (res.data && res.data.user) {
        dispatch(updateUser(res.data.user))

        // setFormData({
        //   username: res.data.user.username || '',
        //   full_name: res.data.user.full_name || '',
        //   phone_number: res.data.user.phone_number || ''
        // })

        toast.success(res.message || 'Cập nhật thành công!')
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Update Profile Error:', error)
      toast.error(error.response?.data?.message || 'Lỗi cập nhật hồ sơ')
    } finally {
      dispatch(setLoading(false))
    }
  }

  const inputClass = 'w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-4'

  return (
    <div className="min-h-screen bg-linear-to-tr from-slate-100 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center border border-white/20">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <i className="fa-solid fa-house-user text-indigo-600"></i> Bảng điều khiển
          </h1>
          <button onClick={handleLogout} className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg font-medium transition flex items-center gap-2">
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cột trái: Card cá nhân */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white">
                  {userInfo?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-6 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-1">{userInfo?.full_name}</h2>
              <p className="text-gray-500 text-sm mb-6">@{userInfo?.username}</p>

              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-4 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100">
                  {userInfo?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin chi tiết */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-bold text-gray-800">Thông tin chi tiết</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 active:scale-95"
                  >
                    <i className="fa-solid fa-user-pen"></i> Chỉnh sửa hồ sơ
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">

                  {/* Họ và tên */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className={inputClass}
                        placeholder="Nhập họ và tên"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 mb-6 border border-gray-100 italic md:not-italic">
                        {userInfo?.full_name}
                      </div>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className={inputClass}
                        placeholder="Nhập số điện thoại"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 mb-6 border border-gray-100">
                        {userInfo?.phone_number}
                      </div>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Tên người dùng (ID)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 mb-6 border border-gray-100">
                        @{userInfo?.username}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-700 mb-2">Địa chỉ Email</label>
                    <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-500 mb-6 border border-transparent cursor-not-allowed">
                      {userInfo?.email}
                    </div>
                  </div>

                </div>

                {/* Các nút điều khiển khi ở chế độ Edit */}
                {isEditing && (
                  <div className="flex gap-4 mt-6 pt-6 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
                    >
                      {loading ? 'Đang lưu...' : 'Xác nhận thay đổi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          username: userInfo.username,
                          full_name: userInfo.full_name || '',
                          phone_number: userInfo.phone_number || ''
                        })
                      }}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
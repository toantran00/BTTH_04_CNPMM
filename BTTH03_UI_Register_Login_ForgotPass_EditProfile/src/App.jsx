import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '~/components/ProtectedRoute'
import Login from '~/pages/Login'
import Register from '~/pages/Register'
import AdminDashboard from '~/pages/AdminDashboard'
import Home from '~/pages/Home'
import HomePage from '~/pages/HomePage'
import ShopPage from '~/pages/ShopPage'
import ProductDetailPage from '~/pages/ProductDetailPage'
import CategoryPage from '~/pages/CategoryPage'
import TopProductsPage from '~/pages/TopProductsPage'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ForgotPassword from '~/pages/ForgotPassword'

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Route trang chủ shop (sau khi đăng nhập thành viên) */}
        <Route path="/home" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <HomePage />
          </ProtectedRoute>
        } />

        {/* Route cửa hàng + tìm kiếm lọc */}
        <Route path="/shop" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <ShopPage />
          </ProtectedRoute>
        } />

        {/* Route chi tiết sản phẩm */}
        <Route path="/product/:slug" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <ProductDetailPage />
          </ProtectedRoute>
        } />

        {/* CHỨC NĂNG 1: Sản phẩm theo danh mục - Lazy loading */}
        <Route path="/category/:slug" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <CategoryPage />
          </ProtectedRoute>
        } />

        {/* CHỨC NĂNG 2: Top 10 bán chạy + xem nhiều (horizontal pagination) */}
        <Route path="/top" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <TopProductsPage />
          </ProtectedRoute>
        } />

        {/* Route trang profile (giữ nguyên từ bài cũ) */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <Home />
          </ProtectedRoute>
        } />

        {/* Route CHỈ dành cho Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Mặc định quay về login nếu không khớp route nào */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
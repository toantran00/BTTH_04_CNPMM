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
import CartPage from '~/pages/CartPage'
import CheckoutPage from '~/pages/CheckoutPage'
import OrdersPage from '~/pages/OrdersPage'
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

        <Route path="/home" element={<ProtectedRoute allowedRoles={['user', 'admin']}><HomePage /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute allowedRoles={['user', 'admin']}><ShopPage /></ProtectedRoute>} />
        <Route path="/product/:slug" element={<ProtectedRoute allowedRoles={['user', 'admin']}><ProductDetailPage /></ProtectedRoute>} />
        <Route path="/category/:slug" element={<ProtectedRoute allowedRoles={['user', 'admin']}><CategoryPage /></ProtectedRoute>} />
        <Route path="/top" element={<ProtectedRoute allowedRoles={['user', 'admin']}><TopProductsPage /></ProtectedRoute>} />

        {/* Giỏ hàng */}
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['user', 'admin']}><CartPage /></ProtectedRoute>} />

        {/* Thanh toán */}
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['user', 'admin']}><CheckoutPage /></ProtectedRoute>} />

        {/* Đơn hàng — list và detail */}
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['user', 'admin']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute allowedRoles={['user', 'admin']}><OrdersPage /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'admin']}><Home /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
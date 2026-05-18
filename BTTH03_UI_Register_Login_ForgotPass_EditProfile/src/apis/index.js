import authorizedAxiosInstance from '~/utils/authorizedAxios'
import { API_ROOT } from '~/utils/constants'

/**
 * Đăng ký tài khoản mới
 */
const registerUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/api/auth/register`, data)
  return response.data
}

/**
 * Xác thực OTP kích hoạt tài khoản
 */
const verifyOTPAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/api/auth/verify-otp`, data)
  return response.data
}

/**
 * Quên mật khẩu - Gửi yêu cầu lấy OTP
 */
const forgotPasswordAPI = async (email) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/api/auth/forgot-password`, { email })
  return response.data
}

/**
 * Quên mật khẩu - Đặt lại mật khẩu mới
 */
const resetPasswordAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/api/auth/reset-password`, data)
  return response.data
}

const loginUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/api/auth/login`, data)
  return response.data
}

const updateProfileAPI = async (data) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/api/auth/update-profile`, data)
  return response.data
}

// ==================== PRODUCT APIs ====================

/**
 * Lấy dữ liệu trang chủ shop (featured, newest, bestsellers, categories)
 */
const getHomeDataAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/api/products/home`)
  return response.data
}

/**
 * Lấy chi tiết sản phẩm theo slug
 */
const getProductDetailAPI = async (slug) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/api/products/${slug}`)
  return response.data
}

/**
 * Tìm kiếm và lọc sản phẩm
 * @param {Object} params - { keyword, categoryId, minPrice, maxPrice, brand, sortBy, page, limit }
 */
const searchProductsAPI = async (params) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, v)
  })
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/api/products/search?${query.toString()}`)
  return response.data
}

/**
 * Lấy danh sách danh mục
 */
const getCategoriesAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/api/products/categories`)
  return response.data
}

/**
 * Lấy danh sách thương hiệu
 */
const getBrandsAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/api/products/brands`)
  return response.data
}

/**
 * CHỨC NĂNG 2: Lấy top 10 bán chạy + xem nhiều nhất
 * @param {number} limit - số sản phẩm (mặc định 10)
 */
const getTopProductsAPI = async (limit = 10) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/api/products/top?limit=${limit}`)
  return response.data
}

/**
 * CHỨC NĂNG 1: Lấy sản phẩm theo danh mục (Lazy loading)
 * @param {string} slug - slug danh mục
 * @param {number} page - trang hiện tại
 * @param {number} limit - số sản phẩm mỗi trang
 */
const getProductsByCategoryAPI = async (slug, page = 1, limit = 8, sortBy = 'sold_desc') => {
  const response = await authorizedAxiosInstance.get(
    `${API_ROOT}/api/products/category/${slug}?page=${page}&limit=${limit}&sortBy=${sortBy}`
  )
  return response.data
}

export const authAPI = {
  registerUserAPI,
  verifyOTPAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  loginUserAPI,
  updateProfileAPI
}

export const productAPI = {
  getHomeDataAPI,
  getProductDetailAPI,
  searchProductsAPI,
  getCategoriesAPI,
  getBrandsAPI,
  getTopProductsAPI,
  getProductsByCategoryAPI
}
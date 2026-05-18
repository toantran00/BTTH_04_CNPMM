const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { protect } = require('../middleware/authMiddleware')

// Các route cần bảo vệ bằng JWT (user phải đăng nhập)
router.get('/home', protect, productController.getHomeData)
router.get('/categories', protect, productController.getCategories)
router.get('/brands', protect, productController.getBrands)
router.get('/search', protect, productController.searchProducts)

// CHỨC NĂNG 2: Top 10 bán chạy + xem nhiều nhất (đặt trước /:slug)
router.get('/top', protect, productController.getTopProducts)

// CHỨC NĂNG 1: Sản phẩm theo danh mục - lazy loading (đặt trước /:slug)
router.get('/category/:slug', protect, productController.getByCategory)

// Route chi tiết sản phẩm - phải đặt sau tất cả các route cụ thể
router.get('/:slug', protect, productController.getProductDetail)

module.exports = router

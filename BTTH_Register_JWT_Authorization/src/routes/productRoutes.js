const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { protect } = require('../middleware/authMiddleware')

// Các route cần bảo vệ bằng JWT (user phải đăng nhập)
router.get('/home', protect, productController.getHomeData)
router.get('/categories', protect, productController.getCategories)
router.get('/brands', protect, productController.getBrands)
router.get('/search', protect, productController.searchProducts)

// Route chi tiết sản phẩm - phải đặt sau /search, /home, /categories
router.get('/:slug', protect, productController.getProductDetail)

module.exports = router

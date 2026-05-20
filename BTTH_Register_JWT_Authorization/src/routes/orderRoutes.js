const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.post('/', orderController.createOrder)          // Đặt hàng
router.get('/', orderController.getMyOrders)           // Lịch sử
router.get('/:id', orderController.getOrderDetail)     // Chi tiết
router.put('/:id/cancel', orderController.cancelOrder) // Hủy đơn

module.exports = router

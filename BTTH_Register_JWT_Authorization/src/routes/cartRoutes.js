const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect) // Tất cả route cart cần đăng nhập

router.get('/', cartController.getCart)
router.post('/add', cartController.addToCart)
router.put('/update/:itemId', cartController.updateItem)
router.delete('/remove/:itemId', cartController.removeItem)
router.delete('/clear', cartController.clearCart)

module.exports = router

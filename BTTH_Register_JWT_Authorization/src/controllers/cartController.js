const cartRepository = require('../repositories/cartRepository')
const db = require('../config/db')

const cartController = {
  // GET /api/cart
  getCart: async (req, res) => {
    try {
      const userId = req.user.id
      const items = await cartRepository.getByUserId(userId)

      const totalAmount = items.reduce((sum, i) => sum + i.final_price * i.quantity, 0)
      const shippingFee = totalAmount >= 500000 ? 0 : 30000
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

      res.json({
        status: 'success',
        data: { items, totalAmount, shippingFee, finalAmount: totalAmount + shippingFee, itemCount }
      })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // POST /api/cart/add  { productId, quantity, size }
  addToCart: async (req, res) => {
    try {
      const userId = req.user.id
      const { productId, quantity = 1, size } = req.body

      if (!productId) return res.status(400).json({ status: 'error', message: 'Thiếu productId' })

      // Kiểm tra sản phẩm tồn tại + còn hàng
      const [products] = await db.execute('SELECT id, stock, name FROM products WHERE id = ?', [productId])
      if (!products[0]) return res.status(404).json({ status: 'error', message: 'Sản phẩm không tồn tại' })
      if (products[0].stock < quantity) {
        return res.status(400).json({ status: 'error', message: 'Số lượng vượt tồn kho' })
      }

      await cartRepository.addOrUpdate(userId, productId, quantity, size)
      const itemCount = await cartRepository.countItems(userId)

      res.json({ status: 'success', message: 'Đã thêm vào giỏ hàng', data: { itemCount } })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // PUT /api/cart/update/:itemId  { quantity }
  updateItem: async (req, res) => {
    try {
      const userId = req.user.id
      const { itemId } = req.params
      const { quantity } = req.body

      if (quantity === undefined) return res.status(400).json({ status: 'error', message: 'Thiếu quantity' })

      await cartRepository.updateQuantity(itemId, userId, quantity)
      const items = await cartRepository.getByUserId(userId)
      const totalAmount = items.reduce((sum, i) => sum + i.final_price * i.quantity, 0)
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

      res.json({ status: 'success', data: { items, totalAmount, itemCount } })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // DELETE /api/cart/remove/:itemId
  removeItem: async (req, res) => {
    try {
      const userId = req.user.id
      const { itemId } = req.params
      await cartRepository.removeItem(itemId, userId)
      const itemCount = await cartRepository.countItems(userId)
      res.json({ status: 'success', message: 'Đã xoá khỏi giỏ hàng', data: { itemCount } })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // DELETE /api/cart/clear
  clearCart: async (req, res) => {
    try {
      await cartRepository.clearCart(req.user.id)
      res.json({ status: 'success', message: 'Đã xoá giỏ hàng' })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  }
}

module.exports = cartController

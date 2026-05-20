const orderRepository = require('../repositories/orderRepository')
const cartRepository = require('../repositories/cartRepository')

const orderController = {
  // POST /api/orders — Đặt hàng (checkout)
  createOrder: async (req, res) => {
    try {
      const userId = req.user.id
      const { receiverName, receiverPhone, shippingAddress, paymentMethod, notes, useCartItems, items } = req.body

      // Lấy items từ giỏ hàng hoặc từ request
      let orderItems = []
      if (useCartItems) {
        const cartItems = await cartRepository.getByUserId(userId)
        if (cartItems.length === 0) {
          return res.status(400).json({ status: 'error', message: 'Giỏ hàng trống' })
        }
        orderItems = cartItems.map(ci => ({
          productId: ci.product_id,
          name: ci.name,
          slug: ci.slug,
          image: ci.image,
          brand: ci.brand,
          size: ci.size,
          finalPrice: parseFloat(ci.final_price),
          quantity: ci.quantity
        }))
      } else {
        orderItems = items
      }

      if (!receiverName || !receiverPhone || !shippingAddress) {
        return res.status(400).json({ status: 'error', message: 'Thiếu thông tin giao hàng' })
      }

      const orderId = await orderRepository.createOrder(userId, {
        receiverName, receiverPhone, shippingAddress, paymentMethod, notes, items: orderItems
      })

      // Xoá giỏ hàng sau khi đặt
      if (useCartItems) await cartRepository.clearCart(userId)

      res.status(201).json({ status: 'success', message: 'Đặt hàng thành công!', data: { orderId } })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // GET /api/orders — Lịch sử đơn hàng
  getMyOrders: async (req, res) => {
    try {
      const orders = await orderRepository.getOrdersByUserId(req.user.id)
      res.json({ status: 'success', data: orders })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // GET /api/orders/:id — Chi tiết đơn hàng
  getOrderDetail: async (req, res) => {
    try {
      const order = await orderRepository.getOrderById(req.params.id, req.user.id)
      if (!order) return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn hàng' })

      const timeLeft = orderRepository.getCancelTimeLeft(order)
      res.json({ status: 'success', data: { ...order, cancelTimeLeft: timeLeft } })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  },

  // PUT /api/orders/:id/cancel — Hủy đơn
  cancelOrder: async (req, res) => {
    try {
      const result = await orderRepository.cancelOrder(req.params.id, req.user.id, req.body.reason)
      if (!result.success) return res.status(400).json({ status: 'error', message: result.message })
      res.json({ status: 'success', message: result.message, data: { newStatus: result.newStatus } })
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message })
    }
  }
}

module.exports = orderController

const db = require('../config/db')

// Hằng số trạng thái đơn hàng
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  CANCEL_REQUESTED: 'cancel_requested'
}

const AUTO_CONFIRM_MINUTES = 30  // Tự động xác nhận sau 30 phút
const CANCEL_DEADLINE_MINUTES = 30 // Chỉ hủy trong 30 phút đầu

const orderRepository = {
  // ── Tạo đơn hàng mới ─────────────────────────────────────
  createOrder: async (userId, { receiverName, receiverPhone, shippingAddress, paymentMethod, notes, items }) => {
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      // Tính tổng tiền
      let totalAmount = 0
      for (const item of items) {
        totalAmount += item.finalPrice * item.quantity
      }
      const shippingFee = totalAmount >= 500000 ? 0 : 30000
      const finalAmount = totalAmount + shippingFee

      // Tạo order
      const [orderResult] = await conn.execute(`
        INSERT INTO orders
          (user_id, total_amount, shipping_fee, final_amount, receiver_name, receiver_phone,
           shipping_address, payment_method, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [userId, totalAmount, shippingFee, finalAmount, receiverName, receiverPhone,
          shippingAddress, paymentMethod || 'cod', notes || null])

      const orderId = orderResult.insertId

      // Tạo order items
      for (const item of items) {
        await conn.execute(`
          INSERT INTO order_items
            (order_id, product_id, product_name, product_slug, product_image, brand, size, price, quantity, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, item.productId, item.name, item.slug, item.image, item.brand,
            item.size || null, item.finalPrice, item.quantity, item.finalPrice * item.quantity])

        // Giảm stock
        await conn.execute(
          'UPDATE products SET sold = sold + ? WHERE id = ?',
          [item.quantity, item.productId]
        )
      }

      // Ghi lịch sử trạng thái
      await conn.execute(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [orderId, 'pending', 'Đơn hàng đã được đặt thành công']
      )

      await conn.commit()
      return orderId
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  // ── Lấy danh sách đơn hàng của user ──────────────────────
  getOrdersByUserId: async (userId) => {
    // Auto-confirm đơn pending quá 30 phút
    await db.execute(`
      UPDATE orders
      SET status = 'confirmed', confirmed_at = NOW(),
          updated_at = NOW()
      WHERE user_id = ? AND status = 'pending'
        AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= ?
    `, [userId, AUTO_CONFIRM_MINUTES])

    const [rows] = await db.execute(`
      SELECT o.*,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
        (SELECT GROUP_CONCAT(product_name SEPARATOR ', ')
         FROM order_items WHERE order_id = o.id LIMIT 1) AS product_summary
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId])
    return rows
  },

  // ── Lấy chi tiết 1 đơn hàng ──────────────────────────────
  getOrderById: async (orderId, userId) => {
    // Auto-confirm nếu cần
    await db.execute(`
      UPDATE orders
      SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
      WHERE id = ? AND user_id = ? AND status = 'pending'
        AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= ?
    `, [orderId, userId, AUTO_CONFIRM_MINUTES])

    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    )
    if (!orders[0]) return null

    const order = orders[0]

    // Lấy order items
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    )

    // Lấy lịch sử trạng thái
    const [history] = await db.execute(
      'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    )

    return { ...order, items, statusHistory: history }
  },

  // ── Hủy đơn hàng ─────────────────────────────────────────
  cancelOrder: async (orderId, userId, reason) => {
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    )
    const order = orders[0]
    if (!order) return { success: false, message: 'Không tìm thấy đơn hàng' }

    const minutesSinceCreated = Math.floor(
      (Date.now() - new Date(order.created_at).getTime()) / 60000
    )
    const { status } = order

    // Không thể hủy nếu đang giao hoặc đã giao
    if (['shipping', 'delivered', 'cancelled'].includes(status)) {
      return { success: false, message: 'Không thể hủy đơn hàng ở trạng thái này' }
    }

    // Đang chuẩn bị hàng → chỉ gửi yêu cầu hủy
    if (status === 'preparing') {
      await db.execute(
        `UPDATE orders SET status = 'cancel_requested', cancel_reason = ?, updated_at = NOW() WHERE id = ?`,
        [reason || 'Khách yêu cầu hủy', orderId]
      )
      await db.execute(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [orderId, 'cancel_requested', `Yêu cầu hủy: ${reason || 'Khách yêu cầu hủy'}`]
      )
      return { success: true, message: 'Đã gửi yêu cầu hủy đơn đến shop', newStatus: 'cancel_requested' }
    }

    // pending/confirmed: chỉ hủy được trong 30 phút đầu
    if (minutesSinceCreated > CANCEL_DEADLINE_MINUTES) {
      return {
        success: false,
        message: `Chỉ có thể hủy trong ${CANCEL_DEADLINE_MINUTES} phút sau khi đặt hàng`
      }
    }

    // Hoàn stock
    const [items] = await db.execute(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    )
    for (const item of items) {
      await db.execute(
        'UPDATE products SET sold = GREATEST(sold - ?, 0) WHERE id = ?',
        [item.quantity, item.product_id]
      )
    }

    await db.execute(
      `UPDATE orders SET status = 'cancelled', cancel_reason = ?, updated_at = NOW() WHERE id = ?`,
      [reason || 'Khách hủy đơn', orderId]
    )
    await db.execute(
      'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
      [orderId, 'cancelled', `Đã hủy: ${reason || 'Khách hủy đơn'}`]
    )

    return { success: true, message: 'Đơn hàng đã được hủy thành công', newStatus: 'cancelled' }
  },

  // ── Kiểm tra thời gian còn lại được phép hủy (giây) ──────
  getCancelTimeLeft: (order) => {
    const elapsed = (Date.now() - new Date(order.created_at).getTime()) / 1000
    const deadline = CANCEL_DEADLINE_MINUTES * 60
    return Math.max(0, Math.round(deadline - elapsed))
  }
}

module.exports = orderRepository

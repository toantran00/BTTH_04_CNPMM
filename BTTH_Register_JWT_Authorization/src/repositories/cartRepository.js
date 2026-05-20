const db = require('../config/db')

const cartRepository = {
  // Lấy toàn bộ giỏ hàng của user (kèm thông tin sản phẩm)
  getByUserId: async (userId) => {
    const [rows] = await db.execute(`
      SELECT
        ci.id, ci.quantity, ci.size, ci.updated_at,
        p.id AS product_id, p.name, p.slug, p.brand,
        p.price, p.discount_percent, p.stock,
        (p.price - (p.price * p.discount_percent / 100)) AS final_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.updated_at DESC
    `, [userId])
    return rows
  },

  // Thêm hoặc cập nhật item trong giỏ hàng
  addOrUpdate: async (userId, productId, quantity, size) => {
    // Nếu đã có item này → cộng thêm số lượng
    await db.execute(`
      INSERT INTO cart_items (user_id, product_id, quantity, size)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = NOW()
    `, [userId, productId, quantity, size || null])
  },

  // Cập nhật số lượng trực tiếp (set, không cộng)
  updateQuantity: async (cartItemId, userId, quantity) => {
    if (quantity <= 0) {
      return cartRepository.removeItem(cartItemId, userId)
    }
    const [result] = await db.execute(
      'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [quantity, cartItemId, userId]
    )
    return result
  },

  // Xoá 1 item
  removeItem: async (cartItemId, userId) => {
    const [result] = await db.execute(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    )
    return result
  },

  // Xoá toàn bộ giỏ hàng của user (sau khi đặt hàng)
  clearCart: async (userId) => {
    await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId])
  },

  // Đếm số loại sản phẩm trong giỏ
  countItems: async (userId) => {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM cart_items WHERE user_id = ?',
      [userId]
    )
    return rows[0].count
  }
}

module.exports = cartRepository

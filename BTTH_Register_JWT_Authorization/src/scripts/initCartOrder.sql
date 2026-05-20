-- ============================================================
-- Migration: Giỏ hàng + Đơn hàng
-- ============================================================
USE shoes_management;

-- ── CART: Lưu trữ giỏ hàng trên Database ──────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cart (user_id, product_id, size),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ORDERS: Đơn hàng ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 30000,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  receiver_name VARCHAR(200) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method ENUM('cod','momo','zalopay') DEFAULT 'cod',
  payment_status ENUM('pending','paid','refunded') DEFAULT 'pending',
  -- Trạng thái đơn hàng:
  -- pending        = 1. Đơn hàng mới
  -- confirmed      = 2. Đã xác nhận (tự động sau 30 phút hoặc thủ công)
  -- preparing      = 3. Shop đang chuẩn bị hàng
  -- shipping       = 4. Đang giao hàng
  -- delivered      = 5. Đã giao thành công
  -- cancelled      = 6. Hủy đơn hàng
  -- cancel_requested = Gửi yêu cầu hủy (khi đơn đang ở bước preparing)
  status ENUM('pending','confirmed','preparing','shipping','delivered','cancelled','cancel_requested') DEFAULT 'pending',
  cancel_reason TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  confirmed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ORDER ITEMS: Chi tiết sản phẩm trong đơn ─────────────
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_slug VARCHAR(200),
  product_image VARCHAR(500),
  brand VARCHAR(100),
  size VARCHAR(20),
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ORDER STATUS HISTORY: Lịch sử thay đổi trạng thái ────
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

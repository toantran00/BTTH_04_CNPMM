-- ============================================================
-- Script khởi tạo CSDL cho Shop Giày
-- DB: shoes_management
-- ============================================================

USE shoes_management;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER DATABASE shoes_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng danh mục
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng sản phẩm
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  discount_percent INT DEFAULT 0,
  stock INT DEFAULT 0,
  sold INT DEFAULT 0,
  brand VARCHAR(100),
  is_featured TINYINT(1) DEFAULT 0,
  is_new TINYINT(1) DEFAULT 0,
  is_bestseller TINYINT(1) DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng hình ảnh sản phẩm
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE product_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA - Danh mục
-- ============================================================
INSERT IGNORE INTO categories (name, slug, description, image_url) VALUES
('Giày Chạy Bộ', 'giay-chay-bo', 'Giày chuyên dụng cho chạy bộ, marathon', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'),
('Giày Bóng Rổ', 'giay-bong-ro', 'Giày chơi bóng rổ chuyên nghiệp', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80'),
('Giày Thời Trang', 'giay-thoi-trang', 'Giày sneaker thời trang đường phố', 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=80'),
('Giày Đá Bóng', 'giay-da-bong', 'Giày đá bóng sân cỏ và futsal', 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&q=80'),
('Giày Tập Gym', 'giay-tap-gym', 'Giày tập luyện trong phòng gym', 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&q=80');

-- ============================================================
-- SEED DATA - Sản phẩm
-- ============================================================
INSERT IGNORE INTO products (category_id, name, slug, description, price, discount_percent, stock, sold, brand, is_featured, is_new, is_bestseller, rating, review_count) VALUES
-- Giày Chạy Bộ (category_id=1)
(1, 'Nike Air Zoom Pegasus 40', 'nike-air-zoom-pegasus-40',
 'Đôi giày chạy bộ huyền thoại với đệm Air Zoom phản hồi nhanh, lý tưởng cho mọi cự ly. Phần mũi giày được mở rộng, tạo sự thoải mái tối đa khi chạy dài.',
 2890000, 15, 45, 312, 'Nike', 1, 0, 1, 4.8, 256),

(1, 'Adidas Ultraboost 23', 'adidas-ultraboost-23',
 'Công nghệ BOOST™ mang lại năng lượng hoàn hảo cho từng bước chân. Phần upper Primeknit+ ôm sát bàn chân, tạo cảm giác như một với đôi giày.',
 3200000, 10, 30, 198, 'Adidas', 1, 1, 0, 4.7, 189),

(1, 'New Balance Fresh Foam 1080v13', 'nb-fresh-foam-1080v13',
 'Đệm Fresh Foam X mang lại trải nghiệm êm ái nhất trong dòng sản phẩm chạy bộ của New Balance. Thiết kế engineered mesh thoáng khí suốt quá trình vận động.',
 2650000, 0, 60, 87, 'New Balance', 0, 1, 0, 4.6, 134),

-- Giày Bóng Rổ (category_id=2)
(2, 'Nike LeBron 21', 'nike-lebron-21',
 'Đôi giày mang tên LeBron James với công nghệ Max Air Zoom tại gót và mũi giày, hỗ trợ tối đa cho các cú nhảy và xoay người trên sân.',
 4500000, 0, 20, 145, 'Nike', 1, 1, 0, 4.9, 302),

(2, 'Adidas D.O.N. Issue 6', 'adidas-don-issue-6',
 'Dành cho những tay cơ thích tốc độ. Đệm Lightstrike Pro siêu nhẹ giúp bạn bứt tốc nhanh, trong khi đế cao su ôm sát sàn tạo độ bám tuyệt vời.',
 2200000, 20, 35, 210, 'Adidas', 0, 0, 1, 4.5, 178),

-- Giày Thời Trang (category_id=3)
(3, 'Nike Air Force 1 Low', 'nike-air-force-1-low',
 'Biểu tượng văn hóa đường phố từ 1982 đến nay. Nike Air Force 1 với đế Air đơn giản nhưng mạnh mẽ, thiết kế da bò cao cấp không bao giờ lỗi mốt.',
 1890000, 0, 100, 892, 'Nike', 1, 0, 1, 4.7, 1024),

(3, 'Adidas Stan Smith', 'adidas-stan-smith',
 'Thiết kế tối giản với 3 sọc đặc trưng. Làm từ da thuộc cao cấp, Stan Smith là lựa chọn hoàn hảo cho phong cách thời trang tối giản hiện đại.',
 1650000, 5, 80, 654, 'Adidas', 0, 0, 1, 4.6, 876),

(3, 'New Balance 550', 'nb-550',
 'Lấy cảm hứng từ giày bóng rổ thập niên 80, NB 550 kết hợp hoàn hảo giữa retro và hiện đại. Upper da cao cấp với đế chunky đặc trưng.',
 1750000, 10, 55, 423, 'New Balance', 1, 1, 0, 4.5, 567),

(3, 'Converse Chuck Taylor All Star', 'converse-chuck-taylor',
 'Huyền thoại 100 năm không bao giờ lỗi thời. Thiết kế canvas đơn giản, bền bỉ, phù hợp với mọi phong cách từ casual đến pop art.',
 850000, 0, 120, 1205, 'Converse', 0, 0, 1, 4.4, 2103),

-- Giày Đá Bóng (category_id=4)
(4, 'Adidas Predator Elite', 'adidas-predator-elite',
 'Công nghệ Controlframe™ mang lại khả năng kiểm soát bóng vượt trội. Đế FG phù hợp với mọi loại sân cỏ tự nhiên.',
 3800000, 0, 25, 89, 'Adidas', 1, 1, 0, 4.8, 145),

(4, 'Nike Phantom GX Elite', 'nike-phantom-gx-elite',
 'Bề mặt Gripknit độc quyền với hơn 3.000 nút bám nhỏ giúp kiểm soát bóng chính xác trong mọi điều kiện thời tiết.',
 3600000, 10, 18, 67, 'Nike', 0, 1, 0, 4.7, 98),

-- Giày Tập Gym (category_id=5)
(5, 'Nike Metcon 9', 'nike-metcon-9',
 'Được thiết kế cho CrossFit và luyện tập cường độ cao. Đế flat ổn định cho deadlift, rope climbing và box jump. Phần upper thoáng khí cho mọi buổi tập.',
 2300000, 0, 40, 234, 'Nike', 1, 0, 1, 4.6, 312),

(5, 'Adidas Adipower Weightlifting 3', 'adidas-adipower-wl3',
 'Chuyên dụng cho cử tạ với đế gỗ maple cứng, gót cao 17mm tạo góc tối ưu cho squat và cử tạ đỉnh cao.',
 2800000, 0, 15, 78, 'Adidas', 0, 1, 0, 4.7, 89);

-- ============================================================
-- SEED DATA - Hình ảnh sản phẩm
-- ============================================================
INSERT IGNORE INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
-- Nike Air Zoom Pegasus 40 (id=1)
(1, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 1, 1),
(1, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80', 0, 2),
(1, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80', 0, 3),

-- Adidas Ultraboost 23 (id=2)
(2, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', 1, 1),
(2, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80', 0, 2),
(2, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 3),

-- New Balance 1080 (id=3)
(3, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80', 1, 1),
(3, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 2),

-- Nike LeBron 21 (id=4)
(4, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80', 1, 1),
(4, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 2),
(4, 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80', 0, 3),

-- Adidas DON Issue (id=5)
(5, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80', 1, 1),
(5, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', 0, 2),

-- Nike Air Force 1 (id=6)
(6, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80', 1, 1),
(6, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 2),
(6, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', 0, 3),
(6, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80', 0, 4),

-- Adidas Stan Smith (id=7)
(7, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', 1, 1),
(7, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80', 0, 2),

-- New Balance 550 (id=8)
(8, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80', 1, 1),
(8, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 2),
(8, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80', 0, 3),

-- Converse (id=9)
(9, 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80', 1, 1),
(9, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80', 0, 2),

-- Adidas Predator (id=10)
(10, 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80', 1, 1),
(10, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', 0, 2),
(10, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 3),

-- Nike Phantom (id=11)
(11, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 1, 1),
(11, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80', 0, 2),

-- Nike Metcon (id=12)
(12, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80', 1, 1),
(12, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80', 0, 2),
(12, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 0, 3),

-- Adidas Adipower (id=13)
(13, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80', 1, 1),
(13, 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80', 0, 2);

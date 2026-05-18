-- Thêm cột views vào bảng products (MySQL compatible)
-- Dùng procedure để kiểm tra cột tồn tại trước khi thêm
DROP PROCEDURE IF EXISTS add_views_column;

DELIMITER $$
CREATE PROCEDURE add_views_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'views'
  ) THEN
    ALTER TABLE products ADD COLUMN views INT DEFAULT 0;
  END IF;
END$$
DELIMITER ;

CALL add_views_column();
DROP PROCEDURE IF EXISTS add_views_column;

-- Gán giá trị views thực tế cho dữ liệu mẫu
UPDATE products SET views = FLOOR(sold * 3.5 + RAND() * 500) WHERE views = 0;

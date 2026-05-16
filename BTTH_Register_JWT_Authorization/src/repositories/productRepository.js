const db = require('../config/db')

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

const CATEGORY_NAME_BY_SLUG = {
  'giay-chay-bo': 'Giày Chạy Bộ',
  'giay-bong-ro': 'Giày Bóng Rổ',
  'giay-thoi-trang': 'Giày Thời Trang',
  'giay-da-bong': 'Giày Đá Bóng',
  'giay-tap-gym': 'Giày Tập Gym'
}

const looksMojibake = (value) =>
  typeof value === 'string' && /[�ÃÂÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß├┤┬│]/.test(value)

const normalizeText = (value) => {
  if (!looksMojibake(value)) return value
  try {
    return Buffer.from(value, 'latin1').toString('utf8')
  } catch (error) {
    return value
  }
}

const normalizeCategoryName = (name, slug) => {
  const decoded = normalizeText(name)
  if (looksMojibake(decoded) && CATEGORY_NAME_BY_SLUG[slug]) {
    return CATEGORY_NAME_BY_SLUG[slug]
  }
  return decoded
}

const normalizeCategory = (category) => ({
  ...category,
  name: normalizeCategoryName(category.name, category.slug),
  description: normalizeText(category.description)
})

const normalizeProduct = (product) => ({
  ...product,
  name: normalizeText(product.name),
  description: normalizeText(product.description),
  brand: normalizeText(product.brand),
  category_name: normalizeCategoryName(product.category_name, product.category_slug)
})

const productRepository = {
  // Lấy tất cả danh mục
  getAllCategories: async () => {
    const [rows] = await db.execute('SELECT * FROM categories ORDER BY name')
    return rows.map(normalizeCategory)
  },

  // Lấy sản phẩm nổi bật (featured)
  getFeaturedProducts: async (limit = 6) => {
    const safeLimit = toPositiveInt(limit, 6)
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = 1
      ORDER BY p.sold DESC
      LIMIT ${safeLimit}
    `)
    return rows.map(normalizeProduct)
  },

  // Lấy sản phẩm mới nhất
  getNewProducts: async (limit = 8) => {
    const safeLimit = toPositiveInt(limit, 8)
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_new = 1
      ORDER BY p.created_at DESC
      LIMIT ${safeLimit}
    `)
    return rows.map(normalizeProduct)
  },

  // Lấy sản phẩm bán chạy
  getBestsellerProducts: async (limit = 8) => {
    const safeLimit = toPositiveInt(limit, 8)
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_bestseller = 1
      ORDER BY p.sold DESC
      LIMIT ${safeLimit}
    `)
    return rows.map(normalizeProduct)
  },

  // Lấy chi tiết sản phẩm theo slug (kèm hình ảnh)
  getProductBySlug: async (slug) => {
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `, [slug])
    if (!rows[0]) return null

    const product = normalizeProduct(rows[0])
    const [images] = await db.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [product.id]
    )
    product.images = images
    return product
  },

  // Lấy sản phẩm tương tự (cùng category, khác sản phẩm hiện tại)
  getSimilarProducts: async (categoryId, productId, limit = 4) => {
    const safeLimit = toPositiveInt(limit, 4)
    const [rows] = await db.execute(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ?
      ORDER BY p.sold DESC
      LIMIT ${safeLimit}
    `, [categoryId, productId])
    return rows.map(normalizeProduct)
  },

  // Tìm kiếm và lọc sản phẩm với nhiều điều kiện
  searchAndFilter: async ({ keyword, categoryId, minPrice, maxPrice, brand, sortBy, page = 1, limit = 9 }) => {
    let conditions = []
    let params = []
    const safePage = toPositiveInt(page, 1)
    const safeLimit = toPositiveInt(limit, 9)

    if (keyword) {
      conditions.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)')
      const kw = `%${keyword}%`
      params.push(kw, kw, kw)
    }
    if (categoryId) {
      conditions.push('p.category_id = ?')
      params.push(categoryId)
    }
    if (minPrice) {
      conditions.push('(p.price - (p.price * p.discount_percent / 100)) >= ?')
      params.push(minPrice)
    }
    if (maxPrice) {
      conditions.push('(p.price - (p.price * p.discount_percent / 100)) <= ?')
      params.push(maxPrice)
    }
    if (brand) {
      conditions.push('p.brand = ?')
      params.push(brand)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    let orderClause = 'ORDER BY p.created_at DESC'
    if (sortBy === 'price_asc') orderClause = 'ORDER BY (p.price - (p.price * p.discount_percent / 100)) ASC'
    if (sortBy === 'price_desc') orderClause = 'ORDER BY (p.price - (p.price * p.discount_percent / 100)) DESC'
    if (sortBy === 'sold_desc') orderClause = 'ORDER BY p.sold DESC'
    if (sortBy === 'rating_desc') orderClause = 'ORDER BY p.rating DESC'
    if (sortBy === 'newest') orderClause = 'ORDER BY p.created_at DESC'

    const offset = (safePage - 1) * safeLimit

    // Đếm tổng số sản phẩm
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    )
    const total = countRows[0].total

    // Lấy sản phẩm theo trang
    const [rows] = await db.execute(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ${orderClause}
        LIMIT ${safeLimit} OFFSET ${offset}`,
      params
    )

    return {
      data: rows.map(normalizeProduct),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  },

  // Lấy tất cả brands
  getAllBrands: async () => {
    const [rows] = await db.execute('SELECT DISTINCT brand FROM products ORDER BY brand')
    return rows.map((r) => normalizeText(r.brand))
  }
}

module.exports = productRepository

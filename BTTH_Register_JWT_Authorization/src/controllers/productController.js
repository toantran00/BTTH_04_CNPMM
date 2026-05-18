const productRepository = require('../repositories/productRepository')

const productController = {
  // GET /api/products/home
  getHomeData: async (req, res) => {
    try {
      const [featured, newest, bestsellers, categories] = await Promise.all([
        productRepository.getFeaturedProducts(6),
        productRepository.getNewProducts(8),
        productRepository.getBestsellerProducts(8),
        productRepository.getAllCategories()
      ])
      res.status(200).json({
        status: 'success',
        data: { featured, newest, bestsellers, categories }
      })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  },

  // GET /api/products/:slug  (kèm tăng lượt xem)
  getProductDetail: async (req, res) => {
    try {
      const { slug } = req.params
      const product = await productRepository.getProductBySlug(slug)
      if (!product) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy sản phẩm' })
      }
      // Tăng lượt xem bất đồng bộ, không block response
      productRepository.incrementViews(product.id).catch(() => {})

      const similar = await productRepository.getSimilarProducts(product.category_id, product.id, 4)
      res.status(200).json({
        status: 'success',
        data: { product, similar }
      })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  },

  // GET /api/products/search
  searchProducts: async (req, res) => {
    try {
      const {
        keyword = '',
        categoryId,
        minPrice,
        maxPrice,
        brand,
        sortBy = 'newest',
        page = 1,
        limit = 9
      } = req.query

      const result = await productRepository.searchAndFilter({
        keyword,
        categoryId: categoryId ? parseInt(categoryId) : null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        brand: brand || null,
        sortBy,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      res.status(200).json({ status: 'success', ...result })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  },

  // GET /api/products/categories
  getCategories: async (req, res) => {
    try {
      const categories = await productRepository.getAllCategories()
      res.status(200).json({ status: 'success', data: categories })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  },

  // GET /api/products/brands
  getBrands: async (req, res) => {
    try {
      const brands = await productRepository.getAllBrands()
      res.status(200).json({ status: 'success', data: brands })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  },

  // ── CHỨC NĂNG 1: GET /api/products/category/:slug?page=1&limit=8&sortBy=sold_desc ──
  getByCategory: async (req, res) => {
    try {
      const { slug } = req.params
      const { page = 1, limit = 8, sortBy = 'sold_desc' } = req.query

      const result = await productRepository.getByCategory(slug, parseInt(page), parseInt(limit), sortBy)

      if (!result) {
        return res.status(404).json({ status: 'error', message: 'Không tìm thấy danh mục' })
      }

      res.status(200).json({ status: 'success', ...result })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  },

  // ── CHỨC NĂNG 2: GET /api/products/top?limit=10 ──
  // Trả về top bán chạy nhất + xem nhiều nhất (dùng cho horizontal carousel)
  getTopProducts: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10

      const [bestsellers, mostViewed] = await Promise.all([
        productRepository.getTopBestsellers(limit),
        productRepository.getTopViewed(limit)
      ])

      res.status(200).json({
        status: 'success',
        data: { bestsellers, mostViewed }
      })
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message })
    }
  }
}

module.exports = productController

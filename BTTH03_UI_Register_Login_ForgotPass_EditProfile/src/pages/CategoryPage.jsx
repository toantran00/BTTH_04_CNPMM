import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser } from '~/redux/userSlice'
import { productAPI } from '~/apis'
import { toast } from 'react-toastify'

// ─── Utilities ───────────────────────────────────────────────────────────────
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const calcFinalPrice = (price, discount) => price - (price * discount) / 100

const StarRating = ({ rating }) => {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i}
          className={`w-3 h-3 ${i < full ? 'text-amber-400' : i === full && half ? 'text-amber-300' : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
      <span className="text-gray-400 text-xs ml-1">({rating})</span>
    </span>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onClick, index }) => {
  const finalPrice = calcFinalPrice(product.price, product.discount_percent)
  return (
    <div
      onClick={() => onClick(product.slug)}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-indigo-100 hover:-translate-y-1"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      <div className="relative overflow-hidden bg-gray-50 h-52">
        <img
          src={product.primary_image || 'https://placehold.co/400x300?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image' }}
          loading="lazy"
        />
        {product.discount_percent > 0 && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
            -{product.discount_percent}%
          </span>
        )}
        {product.is_new === 1 && (
          <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">NEW</span>
        )}
        {product.is_bestseller === 1 && !product.is_new && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">HOT</span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            Xem chi tiết →
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-indigo-500 font-bold mb-1 uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 leading-snug min-h-[2.5rem]">{product.name}</h3>
        <div className="mb-2"><StarRating rating={product.rating} /></div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-base font-extrabold text-indigo-600">{formatPrice(finalPrice)}</p>
            {product.discount_percent > 0 && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Đã bán</p>
            <p className="text-xs font-bold text-gray-600">{product.sold.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-52 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"></div>
    <div className="p-4 space-y-2.5">
      <div className="h-3 bg-gray-200 rounded-full w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded-full w-4/5"></div>
      <div className="h-3 bg-gray-200 rounded-full w-3/5"></div>
      <div className="flex justify-between">
        <div className="h-5 bg-gray-200 rounded-full w-2/5"></div>
        <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
      </div>
    </div>
  </div>
)

// ─── Loading Spinner (bottom trigger) ─────────────────────────────────────────
const LoadingMore = () => (
  <div className="flex flex-col items-center gap-3 py-10">
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
    <p className="text-sm text-gray-400 font-medium">Đang tải thêm sản phẩm...</p>
  </div>
)

// ─── End of List indicator ─────────────────────────────────────────────────────
const EndOfList = ({ total }) => (
  <div className="text-center py-10 border-t border-dashed border-gray-200 mt-6">
    <p className="text-2xl mb-2">✅</p>
    <p className="text-sm font-semibold text-gray-600">Đã hiển thị tất cả {total} sản phẩm</p>
    <p className="text-xs text-gray-400 mt-1">Kéo lên để xem lại</p>
  </div>
)

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'sold_desc', label: '🔥 Bán chạy nhất' },
  { value: 'newest', label: '✨ Mới nhất' },
  { value: 'price_asc', label: '💰 Giá thấp → cao' },
  { value: 'price_desc', label: '💎 Giá cao → thấp' },
  { value: 'rating_desc', label: '⭐ Đánh giá cao' },
]

// ════════════════════════════════════════════════════════════════════════════
//  CATEGORY PAGE — LAZY LOADING / INFINITE SCROLL
// ════════════════════════════════════════════════════════════════════════════
const CategoryPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userInfo } = useSelector((s) => s.user)

  // State
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState('sold_desc')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const LIMIT = 8
  const observerRef = useRef(null)    // IntersectionObserver instance
  const sentinelRef = useRef(null)    // div ở cuối trang làm trigger
  const isFetchingRef = useRef(false) // chống gọi API 2 lần

  // Reset khi đổi slug hoặc sortBy
  useEffect(() => {
    setProducts([])
    setPage(1)
    setHasMore(true)
    setInitialLoading(true)
    setCategory(null)
  }, [slug, sortBy])

  // Fetch products — chạy mỗi khi page hoặc slug thay đổi
  const fetchPage = useCallback(async (pageNum) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const res = await productAPI.getProductsByCategoryAPI(slug, pageNum, LIMIT, sortBy)
      if (res.status !== 'success') return

      setCategory(res.category)
      setTotalProducts(res.pagination.total)
      setHasMore(res.pagination.hasMore)
      setProducts((prev) => pageNum === 1 ? res.data : [...prev, ...res.data])
    } catch {
      toast.error('Không thể tải sản phẩm, thử lại sau!')
    } finally {
      setInitialLoading(false)
      setLoadingMore(false)
      isFetchingRef.current = false
    }
  }, [slug, sortBy])

  useEffect(() => {
    fetchPage(page)
  }, [page, fetchPage])

  // IntersectionObserver — quan sát sentinel div ở cuối trang
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          setLoadingMore(true)
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // trigger trước khi chạm đáy 200px
    )

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)

    return () => observerRef.current?.disconnect()
  }, [hasMore])

  const handleLogout = () => {
    dispatch(clearUser())
    toast.info('Đã đăng xuất!')
    navigate('/login')
  }

  const loadedCount = products.length
  const progressPercent = totalProducts > 0 ? Math.round((loadedCount / totalProducts) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SN</span>
            </div>
            <span className="text-xl font-black text-gray-800 hidden sm:block">
              Sneak<span className="text-indigo-600">Peak</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/home')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden md:block">Trang chủ</button>
            <button onClick={() => navigate('/shop')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium hidden md:block">Cửa hàng</button>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold transition">Đăng xuất</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-16">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <button onClick={() => navigate('/home')} className="hover:text-indigo-600 transition font-medium">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate('/shop')} className="hover:text-indigo-600 transition font-medium">Cửa hàng</button>
          <span>/</span>
          <span className="text-gray-700 font-semibold">
            {category ? category.name : '...'}
          </span>
        </nav>

        {/* ── Category Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border-4 border-white"></div>
            <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full border-2 border-white"></div>
          </div>
          <div className="relative">
            {initialLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-white/30 rounded-xl w-48 mb-2"></div>
                <div className="h-4 bg-white/20 rounded-lg w-64"></div>
              </div>
            ) : (
              <>
                <p className="text-white/70 text-sm font-semibold mb-1 uppercase tracking-widest">Danh mục</p>
                <h1 className="text-3xl font-extrabold mb-2">{category?.name}</h1>
                <p className="text-white/80 text-sm max-w-lg">
                  {category?.description || 'Khám phá bộ sưu tập giày chất lượng cao'}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30">
                    {totalProducts} sản phẩm
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold border border-white/30">
                    Đã tải {loadedCount}/{totalProducts}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">Sắp xếp:</span>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border
                    ${sortBy === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-indigo-600'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Dạng danh sách"
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-indigo-600'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Progress bar ── */}
        {!initialLoading && totalProducts > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Đã hiển thị <strong className="text-indigo-600">{loadedCount}</strong> / {totalProducts} sản phẩm</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Product Grid / List ── */}
        {initialLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
            <p className="text-6xl mb-4">📦</p>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Danh mục này chưa có sản phẩm</h3>
            <button onClick={() => navigate('/shop')} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <ProductCard key={`${p.id}-${i}`} product={p} index={i} onClick={(slug) => navigate(`/product/${slug}`)} />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-3">
            {products.map((p, i) => {
              const finalPrice = calcFinalPrice(p.price, p.discount_percent)
              return (
                <div
                  key={`${p.id}-${i}`}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer flex gap-4 p-4"
                >
                  <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    <img
                      src={p.primary_image || 'https://placehold.co/200x200?text=No+Image'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {p.discount_percent > 0 && (
                      <span className="absolute top-1 left-1 bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">-{p.discount_percent}%</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-500 font-bold mb-0.5">{p.brand}</p>
                    <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{p.name}</h3>
                    <StarRating rating={p.rating} />
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-base font-extrabold text-indigo-600">{formatPrice(finalPrice)}</span>
                      {p.discount_percent > 0 && <span className="text-sm text-gray-400 line-through">{formatPrice(p.price)}</span>}
                      <span className="text-xs text-gray-400 ml-auto">Đã bán: {p.sold.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Loading More indicator ── */}
        {loadingMore && <LoadingMore />}

        {/* ── End of list ── */}
        {!hasMore && !initialLoading && products.length > 0 && (
          <EndOfList total={totalProducts} />
        )}

        {/* ── Sentinel div — IntersectionObserver target ── */}
        <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />

        {/* ── Back to top button ── */}
        {products.length > 8 && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center hover:scale-110 active:scale-95 z-40"
            title="Về đầu trang"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </main>
    </div>
  )
}

export default CategoryPage

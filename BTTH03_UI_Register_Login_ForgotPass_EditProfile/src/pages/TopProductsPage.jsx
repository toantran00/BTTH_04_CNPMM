import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser } from '~/redux/userSlice'
import { productAPI } from '~/apis'
import { toast } from 'react-toastify'

// ─── Utilities ───────────────────────────────────────────────────────────────
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const calcFinalPrice = (price, discount) => price - (price * discount) / 100

// ─── Star Rating ─────────────────────────────────────────────────────────────
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
    </span>
  )
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  const colors = {
    1: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-amber-200',
    2: 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-gray-200',
    3: 'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-orange-200',
  }
  const icons = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return (
    <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-lg z-10
      ${colors[rank] || 'bg-indigo-600 text-white shadow-indigo-200'}`}>
      {rank <= 3 ? icons[rank] : `#${rank}`}
    </div>
  )
}

// ─── Horizontal Product Card ──────────────────────────────────────────────────
const HorizontalProductCard = ({ product, rank, onClick }) => {
  const finalPrice = calcFinalPrice(product.price, product.discount_percent)
  return (
    <div
      onClick={() => onClick(product.slug)}
      className="group flex-shrink-0 w-52 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-100 hover:-translate-y-1 overflow-hidden"
    >
      <div className="relative h-44 overflow-hidden bg-gray-50">
        <RankBadge rank={rank} />
        <img
          src={product.primary_image || 'https://placehold.co/300x200?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=No+Image' }}
        />
        {product.discount_percent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">-{product.discount_percent}%</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-indigo-500 font-bold">{product.brand}</p>
        <h3 className="text-sm font-bold text-gray-800 mt-1 mb-2 line-clamp-2 leading-snug min-h-[2.5rem]">{product.name}</h3>
        <StarRating rating={product.rating} />
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-sm font-extrabold text-indigo-600">{formatPrice(finalPrice)}</p>
            {product.discount_percent > 0 && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-44 bg-gray-200"></div>
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      <div className="h-4 bg-gray-200 rounded w-3/5"></div>
      <div className="h-5 bg-gray-200 rounded w-2/5"></div>
    </div>
  </div>
)

// ─── Horizontal Carousel with Pagination ─────────────────────────────────────
const HorizontalCarousel = ({ products, loading, onProductClick, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const trackRef = useRef(null)
  const CARD_WIDTH = 224 // w-52 (208px) + gap-4 (16px)

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const visibleProducts = products.slice(startIndex, startIndex + itemsPerPage)

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(0, p - 1))
  }
  const handleNext = () => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Prev button */}
      <button
        onClick={handlePrev}
        disabled={currentPage === 0}
        className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all
          ${currentPage === 0
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-gray-200 hover:border-indigo-600 hover:scale-110'
          }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Cards container */}
      <div className="overflow-hidden mx-4">
        <div
          ref={trackRef}
          className="flex gap-4 transition-all duration-500"
        >
          {visibleProducts.map((p, i) => (
            <HorizontalProductCard
              key={p.id}
              product={p}
              rank={startIndex + i + 1}
              onClick={onProductClick}
            />
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages - 1}
        className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all
          ${currentPage >= totalPages - 1
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-gray-200 hover:border-indigo-600 hover:scale-110'
          }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`rounded-full transition-all duration-300
                ${i === currentPage
                  ? 'w-6 h-2.5 bg-indigo-600'
                  : 'w-2.5 h-2.5 bg-gray-300 hover:bg-indigo-300'
                }`}
            />
          ))}
        </div>
      )}

      {/* Page counter */}
      <p className="text-center text-xs text-gray-400 mt-2">
        Trang {currentPage + 1} / {totalPages} • Hiển thị {startIndex + 1}–{Math.min(startIndex + itemsPerPage, products.length)} trong {products.length} sản phẩm
      </p>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, badge, badgeColor }) => (
  <div className="flex items-end justify-between mb-8">
    <div>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-gray-800">{title}</h2>
            {badge && (
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  </div>
)

// ════════════════════════════════════════════════════════════════════════════
//  TOP PRODUCTS PAGE
// ════════════════════════════════════════════════════════════════════════════
const TopProductsPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userInfo } = useSelector((s) => s.user)

  const [data, setData] = useState({ bestsellers: [], mostViewed: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'bestsellers' | 'viewed'

  useEffect(() => {
    productAPI.getTopProductsAPI(10)
      .then((res) => {
        if (res.status === 'success') setData(res.data)
      })
      .catch(() => toast.error('Không thể tải dữ liệu top sản phẩm'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    dispatch(clearUser())
    toast.info('Đã đăng xuất!')
    navigate('/login')
  }

  const handleProductClick = (slug) => navigate(`/product/${slug}`)

  const tabs = [
    { key: 'all', label: '🏆 Tất cả', icon: '🏆' },
    { key: 'bestsellers', label: '🔥 Bán chạy', icon: '🔥' },
    { key: 'viewed', label: '👁️ Xem nhiều', icon: '👁️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
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

      <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
        {/* ── Page header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-bold mb-4">
            🏆 Bảng xếp hạng sản phẩm
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Top 10 Sản Phẩm Nổi Bật
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Xếp hạng theo lượt mua và lượt xem. Cập nhật liên tục theo thời gian thực.
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex justify-center gap-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border
                ${activeTab === tab.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TOP BESTSELLERS SECTION ── */}
        {(activeTab === 'all' || activeTab === 'bestsellers') && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
            <SectionHeader
              icon="🔥"
              title="Top 10 Bán Chạy Nhất"
              subtitle="Những đôi giày được lựa chọn nhiều nhất bởi khách hàng"
              badge="Bestseller"
              badgeColor="bg-rose-100 text-rose-600 border border-rose-200"
            />

            {/* Stat cards */}
            {!loading && data.bestsellers.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {data.bestsellers.slice(0, 3).map((p, i) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const colors = [
                    'from-amber-400 to-yellow-500',
                    'from-gray-300 to-gray-400',
                    'from-orange-400 to-amber-600'
                  ]
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p.slug)}
                      className={`bg-gradient-to-br ${colors[i]} rounded-2xl p-4 text-white cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
                    >
                      <div className="text-3xl mb-2">{medals[i]}</div>
                      <p className="text-xs font-bold opacity-80 uppercase mb-1">{p.brand}</p>
                      <p className="font-bold text-sm line-clamp-2 mb-2">{p.name}</p>
                      <p className="text-xs opacity-80">🛒 Đã bán: <strong>{p.sold.toLocaleString()}</strong></p>
                    </div>
                  )
                })}
              </div>
            )}

            <HorizontalCarousel
              products={data.bestsellers}
              loading={loading}
              onProductClick={handleProductClick}
              itemsPerPage={5}
            />
          </section>
        )}

        {/* ── TOP MOST VIEWED SECTION ── */}
        {(activeTab === 'all' || activeTab === 'viewed') && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <SectionHeader
              icon="👁️"
              title="Xem Nhiều Nhất"
              subtitle="Sản phẩm được khách hàng quan tâm và xem nhiều nhất"
              badge="Trending"
              badgeColor="bg-purple-100 text-purple-600 border border-purple-200"
            />

            {/* Most viewed top 3 stat cards */}
            {!loading && data.mostViewed.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {data.mostViewed.slice(0, 3).map((p, i) => {
                  const colors = [
                    'from-violet-500 to-purple-600',
                    'from-indigo-400 to-blue-500',
                    'from-cyan-400 to-teal-500'
                  ]
                  const ranks = ['#1', '#2', '#3']
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p.slug)}
                      className={`bg-gradient-to-br ${colors[i]} rounded-2xl p-4 text-white cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
                    >
                      <div className="text-2xl font-black mb-2">{ranks[i]}</div>
                      <p className="text-xs font-bold opacity-80 uppercase mb-1">{p.brand}</p>
                      <p className="font-bold text-sm line-clamp-2 mb-2">{p.name}</p>
                      <p className="text-xs opacity-80">👁️ Lượt xem: <strong>{(p.views || 0).toLocaleString()}</strong></p>
                    </div>
                  )
                })}
              </div>
            )}

            <HorizontalCarousel
              products={data.mostViewed}
              loading={loading}
              onProductClick={handleProductClick}
              itemsPerPage={5}
            />
          </section>
        )}

        {/* ── Combined leaderboard table (khi tab = all) ── */}
        {activeTab === 'all' && !loading && (
          <section className="mt-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                📊 Bảng xếp hạng tổng hợp
              </h2>
              <p className="text-sm text-gray-500">So sánh thứ hạng bán chạy và xem nhiều</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3 w-12">#</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Sản phẩm</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Thương hiệu</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">🛒 Đã bán</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">👁️ Lượt xem</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">⭐ Đánh giá</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-6 py-3">Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.bestsellers.map((p, i) => {
                    const finalPrice = calcFinalPrice(p.price, p.discount_percent)
                    const rankIcons = ['🥇', '🥈', '🥉']
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleProductClick(p.slug)}
                        className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-lg font-black text-gray-600">
                            {i < 3 ? rankIcons[i] : <span className="text-sm text-gray-400 font-bold">#{i + 1}</span>}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.primary_image || 'https://placehold.co/60x60?text=No'}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                              onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=No' }}
                            />
                            <span className="font-semibold text-sm text-gray-800 group-hover:text-indigo-600 transition line-clamp-2 max-w-48">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{p.brand}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-gray-700">{p.sold.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-gray-700">{(p.views || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-amber-600">⭐ {p.rating}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-extrabold text-indigo-600 text-sm">{formatPrice(finalPrice)}</p>
                          {p.discount_percent > 0 && (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default TopProductsPage

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearUser } from '~/redux/userSlice'
import { productAPI, cartAPI } from '~/apis'
import { toast } from 'react-toastify'

// Utility
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const calcDiscountPrice = (price, discountPercent) =>
  price - (price * discountPercent) / 100

// ─── Star Rating ───────────────────────────────────────────────────────────
const StarRating = ({ rating }) => {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < full ? 'text-amber-400' : (i === full && half) ? 'text-amber-300' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
      <span className="text-gray-500 text-xs ml-1">({rating})</span>
    </span>
  )
}

// ─── Product Card ───────────────────────────────────────────────────────────
const ProductCard = ({ product, onClick }) => {
  const finalPrice = calcDiscountPrice(product.price, product.discount_percent)
  return (
    <div
      onClick={() => onClick(product.slug)}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-indigo-100 hover:-translate-y-1"
    >
      <div className="relative overflow-hidden bg-gray-50 h-52">
        <img
          src={product.primary_image || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image' }}
        />
        {product.discount_percent > 0 && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{product.discount_percent}%
          </span>
        )}
        {product.is_new === 1 && (
          <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg">NEW</span>
        )}
        {product.is_bestseller === 1 && !product.is_new && (
          <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">HOT</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-indigo-500 font-semibold mb-1 uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 leading-snug">{product.name}</h3>
        <div className="mb-2">
          <StarRating rating={product.rating} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-indigo-600">{formatPrice(finalPrice)}</p>
            {product.discount_percent > 0 && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
            )}
          </div>
          <span className="text-xs text-gray-400">Đã bán {product.sold}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, badge }) => (
  <div className="flex items-end justify-between mb-6">
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-2xl font-extrabold text-gray-800">{title}</h2>
        {badge && (
          <span className="ml-2 px-3 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full uppercase">{badge}</span>
        )}
      </div>
      {subtitle && <p className="text-sm text-gray-500 ml-9">{subtitle}</p>}
    </div>
  </div>
)

// ─── Navbar ─────────────────────────────────────────────────────────────────
const Navbar = ({ user, onLogout, onNavigate, cartCount }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SN</span>
            </div>
            <span className="text-xl font-black text-gray-800">Sneak<span className="text-indigo-600">Peak</span></span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate('/home')} className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition">Trang chủ</button>
            <button onClick={() => onNavigate('/shop')} className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition">Cửa hàng</button>
            <button onClick={() => onNavigate('/top')} className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition flex items-center gap-1">
              🏆 Bảng xếp hạng
            </button>
            <button onClick={() => onNavigate('/orders')} className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition">📋 Đơn hàng</button>
            <button onClick={() => onNavigate('/profile')} className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition">Tài khoản</button>
          </div>

          {/* User + Cart */}
          <div className="flex items-center gap-3">
            {/* Cart icon */}
            <button onClick={() => onNavigate('/cart')}
              className="relative w-9 h-9 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center justify-center transition">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.full_name || user?.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero Banner ─────────────────────────────────────────────────────────────
const HeroBanner = ({ user, onShopClick }) => (
  <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden rounded-3xl mx-4 mt-4">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-4 left-8 w-40 h-40 rounded-full border-4 border-white"></div>
      <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full border-4 border-white"></div>
      <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full border-2 border-white"></div>
    </div>
    <div className="relative max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="text-white max-w-lg">
        <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
          🔥 SALE MÙA HÈ - GIẢM ĐẾN 30%
        </div>
        <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3">
          Giày Thể Thao<br/>
          <span className="text-yellow-300">Chính Hãng</span> 2025
        </h1>
        <p className="text-white/80 mb-6 text-base">
          Chào mừng <strong>{user?.full_name || user?.username}</strong>! Khám phá hơn 200+ mẫu giày từ Nike, Adidas, New Balance và nhiều thương hiệu nổi tiếng khác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onShopClick}
            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-yellow-300 hover:text-indigo-800 transition shadow-lg"
          >
            Mua sắm ngay →
          </button>
          <button className="px-6 py-3 bg-white/20 text-white rounded-xl font-bold hover:bg-white/30 transition backdrop-blur-sm border border-white/30">
            Xem ưu đãi
          </button>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-4">
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=320&q=80"
          alt="Featured Shoe"
          className="w-64 h-52 object-cover rounded-2xl shadow-2xl rotate-3 hover:-rotate-3 transition-transform duration-500"
        />
      </div>
    </div>

    {/* Stats bar */}
    <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/20 px-8 py-4">
      <div className="max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-3 gap-4 text-white text-center">
        {[
          { num: '200+', label: 'Mẫu giày' },
          { num: '5+', label: 'Thương hiệu' },
          { num: '10K+', label: 'Khách hàng' }
        ].map((s) => (
          <div key={s.label}>
            <p className="text-xl font-black">{s.num}</p>
            <p className="text-xs text-white/70">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ─── Promo Banners ───────────────────────────────────────────────────────────
const PromoBanners = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { color: 'from-orange-400 to-rose-500', icon: '⚡', title: 'Flash Sale', sub: 'Hôm nay -30%', badge: 'Hết hạn 24h' },
      { color: 'from-emerald-400 to-teal-500', icon: '🚚', title: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 500K', badge: 'Toàn quốc' },
      { color: 'from-violet-500 to-purple-600', icon: '🎁', title: 'Quà tặng hấp dẫn', sub: 'Mua 2 tặng 1 phụ kiện', badge: 'Limited' },
    ].map((p) => (
      <div key={p.title} className={`bg-gradient-to-r ${p.color} rounded-2xl p-5 text-white flex items-center gap-4 shadow-md hover:scale-[1.02] transition-transform cursor-pointer`}>
        <span className="text-4xl">{p.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">{p.title}</h3>
            <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full">{p.badge}</span>
          </div>
          <p className="text-white/80 text-sm">{p.sub}</p>
        </div>
      </div>
    ))}
  </div>
)

// ─── Category Pills ──────────────────────────────────────────────────────────
const CategoryPills = ({ categories, onCategoryClick }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-extrabold text-gray-800">📂 Danh mục sản phẩm</h2>
      <span className="text-xs text-gray-400">Nhấp để xem toàn bộ danh mục</span>
    </div>
    <div className="flex flex-wrap gap-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryClick(cat.slug)}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all font-semibold text-gray-700 hover:text-indigo-700 shadow-sm"
        >
          <span>{cat.name}</span>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  </div>
)


// ─── Product Grid ────────────────────────────────────────────────────────────
const ProductGrid = ({ products, onProductClick }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {products.map((p) => (
      <ProductCard key={p.id} product={p} onClick={onProductClick} />
    ))}
  </div>
)

// ─── Skeleton Loading ────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-52 bg-gray-200"></div>
    <div className="p-4 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-5 bg-gray-200 rounded w-2/5"></div>
    </div>
  </div>
)

// ════════════════════════════════════════════════════════════════════════════
//  HOME PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const HomePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userInfo } = useSelector((state) => state.user)

  const [homeData, setHomeData] = useState({ featured: [], newest: [], bestsellers: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const res = await productAPI.getHomeDataAPI()
        if (res.status === 'success') {
          setHomeData(res.data)
        }
      } catch (err) {
        toast.error('Không thể tải dữ liệu trang chủ')
      } finally {
        setLoading(false)
      }
    }
    const fetchCartCount = async () => {
      try {
        const res = await cartAPI.getCartAPI()
        if (res.status === 'success') setCartCount(res.data.itemCount)
      } catch {}
    }
    fetchHome()
    fetchCartCount()
  }, [])

  const handleLogout = () => {
    dispatch(clearUser())
    toast.info('Đã đăng xuất!')
    navigate('/login')
  }

  const handleProductClick = (slug) => navigate(`/product/${slug}`)
  const handleShopClick = () => navigate('/shop')
  const handleCategoryClick = (categorySlug) => navigate(`/category/${categorySlug}`)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userInfo} onLogout={handleLogout} onNavigate={navigate} cartCount={cartCount} />

      <main className="max-w-7xl mx-auto px-4 pb-12 space-y-10">
        {/* Hero */}
        <HeroBanner user={userInfo} onShopClick={handleShopClick} />

        {/* Promo */}
        <PromoBanners />

        {/* Categories */}
        <CategoryPills categories={homeData.categories} onCategoryClick={handleCategoryClick} />

        {/* Featured */}
        <section>
          <SectionHeader icon="⭐" title="Sản phẩm nổi bật" subtitle="Được yêu thích và tin dùng nhất" badge="Hot" />
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <ProductGrid products={homeData.featured} onProductClick={handleProductClick} />
          )}
        </section>

        {/* Banner quảng cáo giữa trang */}
        <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-8 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10"></div>
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/10"></div>
          <div className="relative text-white max-w-xl">
            <p className="text-sm font-bold mb-2 bg-white/25 inline-block px-3 py-1 rounded-full">🎉 Ưu đãi đặc biệt</p>
            <h2 className="text-2xl font-black mb-2">Thành viên mới - Giảm 15%<br/>cho đơn đầu tiên!</h2>
            <p className="text-white/80 mb-4">Áp dụng cho tất cả sản phẩm trong cửa hàng. Không giới hạn giá trị đơn hàng.</p>
            <button onClick={handleShopClick} className="px-6 py-2.5 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition shadow-lg">
              Nhận ưu đãi →
            </button>
          </div>
        </div>

        {/* Bestsellers */}
        <section>
          <SectionHeader icon="🔥" title="Bán chạy nhất" subtitle="Top sản phẩm được khách hàng chọn mua nhiều nhất" badge="Bestseller" />
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <ProductGrid products={homeData.bestsellers} onProductClick={handleProductClick} />
          )}
        </section>

        {/* New Arrivals */}
        <section>
          <SectionHeader icon="✨" title="Hàng mới về" subtitle="Những đôi giày mới nhất vừa cập bến" badge="New" />
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <ProductGrid products={homeData.newest} onProductClick={handleProductClick} />
          )}
        </section>

        {/* Browse All CTA */}
        <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 mb-4">Chưa tìm được đôi giày ưng ý?</p>
          <button
            onClick={handleShopClick}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-200"
          >
            Xem toàn bộ cửa hàng →
          </button>
        </div>
      </main>
    </div>
  )
}

export default HomePage

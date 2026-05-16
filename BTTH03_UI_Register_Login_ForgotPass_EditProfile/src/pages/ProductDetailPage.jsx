import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, Zoom } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/zoom'
import { productAPI } from '~/apis'
import { clearUser } from '~/redux/userSlice'
import { toast } from 'react-toastify'

// ─── Utilities ───────────────────────────────────────────────────────────────
const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const calcFinalPrice = (price, discountPercent) =>
  price - (price * discountPercent) / 100

const StarRating = ({ rating, count }) => {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-5 h-5 ${i < full ? 'text-amber-400' : (i === full && half) ? 'text-amber-300' : 'text-gray-200'}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        ))}
      </span>
      <span className="text-sm font-semibold text-amber-600">{rating}</span>
      <span className="text-sm text-gray-400">({count} đánh giá)</span>
    </div>
  )
}

// ─── Stock Badge ─────────────────────────────────────────────────────────────
const StockBadge = ({ stock }) => {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">🚫 Hết hàng</span>
  if (stock <= 10)
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">⚠️ Sắp hết - còn {stock} đôi</span>
  return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✅ Còn hàng ({stock} đôi)</span>
}

// ─── Qty Selector ────────────────────────────────────────────────────────────
const QuantitySelector = ({ qty, max, onChange }) => (
  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden w-fit">
    <button
      onClick={() => onChange(Math.max(1, qty - 1))}
      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-lg"
    >−</button>
    <span className="w-12 text-center font-bold text-gray-800">{qty}</span>
    <button
      onClick={() => onChange(Math.min(max, qty + 1))}
      disabled={qty >= max}
      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-lg disabled:opacity-40"
    >+</button>
  </div>
)

// ─── Similar Product Card ─────────────────────────────────────────────────────
const SimilarCard = ({ product, onClick }) => {
  const finalPrice = calcFinalPrice(product.price, product.discount_percent)
  return (
    <div
      onClick={() => onClick(product.slug)}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:-translate-y-1 overflow-hidden"
    >
      <div className="relative h-44 overflow-hidden bg-gray-50">
        <img
          src={product.primary_image || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image' }}
        />
        {product.discount_percent > 0 && (
          <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">-{product.discount_percent}%</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-indigo-500 font-semibold">{product.brand}</p>
        <p className="text-sm font-bold text-gray-800 line-clamp-2 my-1">{product.name}</p>
        <p className="text-sm font-bold text-indigo-600">{formatPrice(finalPrice)}</p>
      </div>
    </div>
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ category, productName, onNav }) => (
  <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
    <button onClick={() => onNav('/home')} className="hover:text-indigo-600 transition font-medium">Trang chủ</button>
    <span>/</span>
    <button onClick={() => onNav('/shop')} className="hover:text-indigo-600 transition font-medium">Cửa hàng</button>
    <span>/</span>
    <button onClick={() => onNav(`/shop?categoryId=${category?.id}`)} className="hover:text-indigo-600 transition font-medium">{category?.name}</button>
    <span>/</span>
    <span className="text-gray-800 font-semibold truncate max-w-48">{productName}</span>
  </nav>
)

// ════════════════════════════════════════════════════════════════════════════
//  PRODUCT DETAIL PAGE
// ════════════════════════════════════════════════════════════════════════════
const ProductDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userInfo } = useSelector((s) => s.user)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [qty, setQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)

  const sizes = [38, 39, 40, 41, 42, 43, 44]

  useEffect(() => {
    setLoading(true)
    setQty(1)
    setSelectedSize(null)
    setAddedToCart(false)
    productAPI.getProductDetailAPI(slug)
      .then((res) => {
        if (res.status === 'success') setData(res.data)
      })
      .catch(() => toast.error('Không thể tải chi tiết sản phẩm'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleLogout = () => {
    dispatch(clearUser())
    toast.info('Đã đăng xuất!')
    navigate('/login')
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.warning('Vui lòng chọn kích cỡ!')
      return
    }
    setAddedToCart(true)
    toast.success(`Đã thêm ${qty} đôi vào giỏ hàng! (Size ${selectedSize})`)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😞</p>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm</h2>
          <button onClick={() => navigate('/shop')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Về cửa hàng</button>
        </div>
      </div>
    )
  }

  const { product, similar } = data
  const finalPrice = calcFinalPrice(product.price, product.discount_percent)
  const savedAmount = product.price - finalPrice
  const images = product.images || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SN</span>
            </div>
            <span className="text-xl font-black text-gray-800">Sneak<span className="text-indigo-600">Peak</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
              ← Quay lại
            </button>
            <button onClick={() => navigate('/shop')} className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition">Cửa hàng</button>
            <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold transition">Đăng xuất</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
        {/* Breadcrumb */}
        <Breadcrumb
          category={{ id: product.category_id, name: product.category_name }}
          productName={product.name}
          onNav={navigate}
        />

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

          {/* ── Image Gallery (Swiper) ── */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <>
                {/* Main swiper */}
                <Swiper
                  modules={[Navigation, Pagination, Thumbs, Zoom]}
                  navigation
                  pagination={{ clickable: true }}
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                  zoom
                  className="rounded-3xl overflow-hidden shadow-xl aspect-square bg-white border border-gray-100"
                  style={{ '--swiper-navigation-color': '#6366f1', '--swiper-pagination-color': '#6366f1' }}
                >
                  {images.map((img) => (
                    <SwiperSlide key={img.id}>
                      <div className="swiper-zoom-container">
                        <img
                          src={img.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image' }}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Thumbnail swiper */}
                {images.length > 1 && (
                  <Swiper
                    modules={[Thumbs]}
                    onSwiper={setThumbsSwiper}
                    spaceBetween={8}
                    slidesPerView={Math.min(images.length, 5)}
                    watchSlidesProgress
                    className="rounded-xl"
                  >
                    {images.map((img) => (
                      <SwiperSlide key={img.id} className="cursor-pointer">
                        <img
                          src={img.image_url}
                          alt=""
                          className="w-full h-20 object-cover rounded-xl border-2 border-transparent [.swiper-slide-thumb-active_&]:border-indigo-500 opacity-70 [.swiper-slide-thumb-active_&]:opacity-100 transition-all"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/100x80?text=Img' }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}

                <p className="text-center text-xs text-gray-400">
                  {images.length} ảnh • Nhấp đúp để phóng to
                </p>
              </>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-3xl flex items-center justify-center">
                <span className="text-gray-400">Không có hình ảnh</span>
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="space-y-5">
            {/* Category tag */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/shop?categoryId=${product.category_id}`)}
                className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-semibold hover:bg-indigo-100 transition border border-indigo-100"
              >
                📂 {product.category_name}
              </button>
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-semibold border border-gray-200">
                🏷️ {product.brand}
              </span>
              {product.is_new === 1 && (
                <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">✨ Hàng mới</span>
              )}
              {product.is_bestseller === 1 && (
                <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">🔥 Bán chạy</span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating */}
            <StarRating rating={product.rating} count={product.review_count} />

            {/* Stock & Sold */}
            <div className="flex flex-wrap items-center gap-3">
              <StockBadge stock={product.stock} />
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                </svg>
                <span><strong>{product.sold}</strong> lượt bán</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-black text-indigo-600">{formatPrice(finalPrice)}</span>
                {product.discount_percent > 0 && (
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                )}
              </div>
              {product.discount_percent > 0 && (
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">-{product.discount_percent}%</span>
                  <span className="text-sm text-rose-600 font-semibold">Tiết kiệm {formatPrice(savedAmount)}</span>
                </div>
              )}
            </div>

            {/* Size picker */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">
                Kích cỡ (EU) {selectedSize && <span className="text-indigo-600 ml-2">→ Size {selectedSize}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-12 h-12 rounded-xl border-2 font-bold text-sm transition-all
                      ${selectedSize === s
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'
                      }`}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">Số lượng</p>
              <div className="flex items-center gap-4">
                <QuantitySelector qty={qty} max={product.stock} onChange={setQty} />
                <span className="text-sm text-gray-400">Tổng: <strong className="text-gray-700">{formatPrice(finalPrice * qty)}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-4 rounded-2xl font-bold text-base transition-all shadow-lg
                  ${addedToCart
                    ? 'bg-green-500 text-white shadow-green-200'
                    : product.stock === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200 active:scale-95'
                  }`}
              >
                {addedToCart ? '✅ Đã thêm vào giỏ!' : product.stock === 0 ? '🚫 Hết hàng' : '🛒 Thêm vào giỏ hàng'}
              </button>
              <button className="p-4 rounded-2xl border-2 border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Policies */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: '🚚', text: 'Giao hàng toàn quốc' },
                { icon: '🔄', text: 'Đổi trả 30 ngày' },
                { icon: '🛡️', text: 'Bảo hành chính hãng' },
              ].map((p) => (
                <div key={p.text} className="flex flex-col items-center text-center gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-xs text-gray-600 font-medium leading-tight">{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12">
          <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            <span>📄</span> Mô tả sản phẩm
          </h2>
          <p className="text-gray-600 leading-relaxed text-base">{product.description}</p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Thương hiệu', value: product.brand },
              { label: 'Danh mục', value: product.category_name },
              { label: 'Đánh giá', value: `${product.rating}/5 ⭐` },
              { label: 'Đã bán', value: `${product.sold} đôi` },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="font-bold text-gray-800 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Similar Products ── */}
        {similar && similar.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <span>👟</span> Sản phẩm tương tự
                <span className="text-sm font-normal text-gray-500 ml-2">trong {product.category_name}</span>
              </h2>
              <button
                onClick={() => navigate(`/shop?categoryId=${product.category_id}`)}
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                Xem thêm →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((sp) => (
                <SimilarCard key={sp.id} product={sp} onClick={(slug) => {
                  navigate(`/product/${slug}`)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductDetailPage

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearUser } from '~/redux/userSlice'
import { productAPI } from '~/apis'
import { toast } from 'react-toastify'

// ─── Utilities ───────────────────────────────────────────────────────────────
const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const calcFinalPrice = (price, discountPercent) =>
    price - (price * discountPercent) / 100

const StarRating = ({ rating }) => {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    return (
        <span className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-3 h-3 ${i < full ? 'text-amber-400' : (i === full && half) ? 'text-amber-300' : 'text-gray-200'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
            ))}
            <span className="text-gray-500 text-xs ml-1">({rating})</span>
        </span>
    )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onClick }) => {
    const finalPrice = calcFinalPrice(product.price, product.discount_percent)
    return (
        <div
            onClick={() => onClick(product.slug)}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-indigo-100 hover:-translate-y-1"
        >
            <div className="relative overflow-hidden bg-gray-50 h-48">
                <img
                    src={product.primary_image || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image' }}
                />
                {product.discount_percent > 0 && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">-{product.discount_percent}%</span>
                )}
                {product.is_new === 1 && (
                    <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">NEW</span>
                )}
                {product.is_bestseller === 1 && !product.is_new && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">HOT</span>
                )}
            </div>
            <div className="p-3">
                <p className="text-xs text-indigo-500 font-semibold">{product.brand}</p>
                <h3 className="text-sm font-bold text-gray-800 my-1 line-clamp-2 leading-snug">{product.name}</h3>
                <div className="mb-2"><StarRating rating={product.rating} /></div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-indigo-600">{formatPrice(finalPrice)}</p>
                        {product.discount_percent > 0 && (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
                        )}
                    </div>
                    <span className="text-xs text-gray-400">Đã bán {product.sold}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">📂 {product.category_name}</p>
            </div>
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/5"></div>
        </div>
    </div>
)

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const FilterPanel = ({ filters, setFilters, categories, brands, onApply, onReset }) => {
    const priceRanges = [
        { label: 'Tất cả mức giá', min: '', max: '' },
        { label: 'Dưới 1 triệu', min: '', max: 1000000 },
        { label: '1 - 2 triệu', min: 1000000, max: 2000000 },
        { label: '2 - 3 triệu', min: 2000000, max: 3000000 },
        { label: 'Trên 3 triệu', min: 3000000, max: '' },
    ]

    const activePriceRange = priceRanges.find(
        (r) => String(r.min) === String(filters.minPrice) && String(r.max) === String(filters.maxPrice)
    )

    return (
        <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6 sticky top-20 self-start">
            <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">⚙️ Bộ lọc</h3>
                <button onClick={onReset} className="text-xs text-rose-500 hover:underline font-semibold">Xóa lọc</button>
            </div>

            {/* Category */}
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Danh mục</p>
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="category"
                            checked={!filters.categoryId}
                            onChange={() => setFilters((f) => ({ ...f, categoryId: '' }))}
                            className="accent-indigo-600"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">Tất cả</span>
                    </label>
                    {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="category"
                                checked={String(filters.categoryId) === String(cat.id)}
                                onChange={() => setFilters((f) => ({ ...f, categoryId: cat.id }))}
                                className="accent-indigo-600"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">{cat.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Mức giá</p>
                <div className="space-y-1.5">
                    {priceRanges.map((range) => (
                        <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="price"
                                checked={
                                    String(filters.minPrice) === String(range.min) &&
                                    String(filters.maxPrice) === String(range.max)
                                }
                                onChange={() => setFilters((f) => ({ ...f, minPrice: range.min, maxPrice: range.max }))}
                                className="accent-indigo-600"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">{range.label}</span>
                        </label>
                    ))}
                </div>
                {/* Custom range */}
                <div className="mt-3 flex gap-2 items-center">
                    <input
                        type="number"
                        placeholder="Từ"
                        value={filters.minPrice}
                        onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="number"
                        placeholder="Đến"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                </div>
            </div>

            {/* Brand */}
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Thương hiệu</p>
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="brand"
                            checked={!filters.brand}
                            onChange={() => setFilters((f) => ({ ...f, brand: '' }))}
                            className="accent-indigo-600"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">Tất cả</span>
                    </label>
                    {brands.map((b) => (
                        <label key={b} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="brand"
                                checked={filters.brand === b}
                                onChange={() => setFilters((f) => ({ ...f, brand: b }))}
                                className="accent-indigo-600"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">{b}</span>
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-md shadow-indigo-100"
            >
                Áp dụng bộ lọc
            </button>
        </aside>
    )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ current, total, onChange }) => {
    const pages = Array.from({ length: total }, (_, i) => i + 1)
    if (total <= 1) return null
    return (
        <div className="flex justify-center gap-2 mt-8">
            <button
                onClick={() => onChange(Math.max(1, current - 1))}
                disabled={current === 1}
                className="w-9 h-9 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-40 font-bold"
            >←</button>
            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={`w-9 h-9 rounded-xl border-2 font-bold text-sm transition
            ${p === current ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                >{p}</button>
            ))}
            <button
                onClick={() => onChange(Math.min(total, current + 1))}
                disabled={current === total}
                className="w-9 h-9 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-40 font-bold"
            >→</button>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
//  SHOP PAGE
// ════════════════════════════════════════════════════════════════════════════
const ShopPage = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userInfo } = useSelector((s) => s.user)
    const [searchParams, setSearchParams] = useSearchParams()

    // States
    const [products, setProducts] = useState([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [showMobileFilter, setShowMobileFilter] = useState(false)

    // Filters state
    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        categoryId: searchParams.get('categoryId') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        brand: searchParams.get('brand') || '',
        sortBy: searchParams.get('sortBy') || 'newest',
        page: parseInt(searchParams.get('page') || '1')
    })

    const [inputKeyword, setInputKeyword] = useState(filters.keyword)

    // Load filter metadata
    useEffect(() => {
        Promise.all([productAPI.getCategoriesAPI(), productAPI.getBrandsAPI()])
            .then(([catRes, brandRes]) => {
                if (catRes.status === 'success') setCategories(catRes.data)
                if (brandRes.status === 'success') setBrands(brandRes.data)
            })
            .catch(() => { })
    }, [])

    // Fetch products
    const fetchProducts = useCallback(async (f) => {
        setLoading(true)
        try {
            const res = await productAPI.searchProductsAPI(f)
            if (res.status === 'success') {
                setProducts(res.data)
                setPagination(res.pagination)
            }
        } catch (err) {
            toast.error('Không thể tải danh sách sản phẩm')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts(filters)
        // Sync URL params
        const params = {}
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) params[k] = v
        })
        setSearchParams(params, { replace: true })
    }, [filters, fetchProducts])

    const applyFilters = () => {
        setFilters((f) => ({ ...f, keyword: inputKeyword, page: 1 }))
        setShowMobileFilter(false)
    }

    const resetFilters = () => {
        const reset = { keyword: '', categoryId: '', minPrice: '', maxPrice: '', brand: '', sortBy: 'newest', page: 1 }
        setFilters(reset)
        setInputKeyword('')
        setShowMobileFilter(false)
    }

    const handleSortChange = (sortBy) => setFilters((f) => ({ ...f, sortBy, page: 1 }))
    const handlePageChange = (page) => {
        setFilters((f) => ({ ...f, page }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const activeFilterCount = [filters.categoryId, filters.minPrice || filters.maxPrice, filters.brand]
        .filter(Boolean).length

    const handleLogout = () => {
        dispatch(clearUser())
        toast.info('Đã đăng xuất!')
        navigate('/login')
    }

    const sortOptions = [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'sold_desc', label: 'Bán chạy nhất' },
        { value: 'rating_desc', label: 'Đánh giá cao nhất' },
        { value: 'price_asc', label: 'Giá tăng dần' },
        { value: 'price_desc', label: 'Giá giảm dần' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/home')}>
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black text-sm">SN</span>
                        </div>
                        <span className="text-xl font-black text-gray-800 hidden sm:block">Sneak<span className="text-indigo-600">Peak</span></span>
                    </div>

                    {/* Search bar */}
                    <div className="flex-1 max-w-xl flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputKeyword}
                                onChange={(e) => setInputKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Tìm kiếm giày, thương hiệu..."
                                className="w-full pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition bg-gray-50"
                            />
                            {inputKeyword && (
                                <button
                                    onClick={() => { setInputKeyword(''); setFilters((f) => ({ ...f, keyword: '', page: 1 })) }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >✕</button>
                            )}
                        </div>
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition text-sm"
                        >
                            🔍 Tìm
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => navigate('/home')} className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition hidden md:block">Trang chủ</button>
                        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 font-semibold transition">Đăng xuất</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-6 pb-16">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800">
                            {filters.keyword ? `Kết quả: "${filters.keyword}"` : '👟 Tất cả sản phẩm'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Tìm thấy <strong>{pagination.total}</strong> sản phẩm
                            {filters.categoryId && categories.find((c) => String(c.id) === String(filters.categoryId)) &&
                                ` trong "${categories.find((c) => String(c.id) === String(filters.categoryId)).name}"`
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setShowMobileFilter(!showMobileFilter)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-400 transition"
                        >
                            ⚙️ Bộ lọc {activeFilterCount > 0 && (
                                <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Sort */}
                        <select
                            value={filters.sortBy}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none cursor-pointer"
                        >
                            {sortOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active filter tags */}
                {(filters.keyword || filters.categoryId || filters.brand || filters.minPrice || filters.maxPrice) && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {filters.keyword && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                🔍 "{filters.keyword}"
                                <button onClick={() => { setFilters((f) => ({ ...f, keyword: '', page: 1 })); setInputKeyword('') }} className="hover:text-indigo-900">✕</button>
                            </span>
                        )}
                        {filters.categoryId && categories.find((c) => String(c.id) === String(filters.categoryId)) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                📂 {categories.find((c) => String(c.id) === String(filters.categoryId)).name}
                                <button onClick={() => setFilters((f) => ({ ...f, categoryId: '', page: 1 }))} className="hover:text-purple-900">✕</button>
                            </span>
                        )}
                        {filters.brand && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                🏷️ {filters.brand}
                                <button onClick={() => setFilters((f) => ({ ...f, brand: '', page: 1 }))} className="hover:text-amber-900">✕</button>
                            </span>
                        )}
                        {(filters.minPrice || filters.maxPrice) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                💰 {filters.minPrice ? formatPrice(filters.minPrice) : '0'} - {filters.maxPrice ? formatPrice(filters.maxPrice) : '∞'}
                                <button onClick={() => setFilters((f) => ({ ...f, minPrice: '', maxPrice: '', page: 1 }))} className="hover:text-green-900">✕</button>
                            </span>
                        )}
                        <button onClick={resetFilters} className="text-xs text-rose-500 hover:underline font-semibold px-1">Xóa tất cả</button>
                    </div>
                )}

                <div className="flex gap-6">
                    {/* Filter Sidebar - Desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <FilterPanel
                            filters={filters}
                            setFilters={setFilters}
                            categories={categories}
                            brands={brands}
                            onApply={applyFilters}
                            onReset={resetFilters}
                        />
                    </div>

                    {/* Mobile filter overlay */}
                    {showMobileFilter && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)}></div>
                            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Bộ lọc</h3>
                                    <button onClick={() => setShowMobileFilter(false)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
                                </div>
                                <FilterPanel
                                    filters={filters}
                                    setFilters={setFilters}
                                    categories={categories}
                                    brands={brands}
                                    onApply={applyFilters}
                                    onReset={resetFilters}
                                />
                            </div>
                        </div>
                    )}

                    {/* Product Grid */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[...Array(9)].map((_, i) => <Skeleton key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
                                <p className="text-6xl mb-4">🔍</p>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm</h3>
                                <p className="text-gray-500 mb-6">Hãy thử thay đổi từ khóa hoặc xóa bớt bộ lọc</p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {products.map((p) => (
                                        <ProductCard
                                            key={p.id}
                                            product={p}
                                            onClick={(slug) => navigate(`/product/${slug}`)}
                                        />
                                    ))}
                                </div>
                                <Pagination
                                    current={pagination.page}
                                    total={pagination.totalPages}
                                    onChange={handlePageChange}
                                />
                                <p className="text-center text-xs text-gray-400 mt-3">
                                    Trang {pagination.page} / {pagination.totalPages} • {pagination.total} sản phẩm
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default ShopPage

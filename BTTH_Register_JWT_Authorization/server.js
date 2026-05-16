const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { corsOptions } = require('./src/config/corsOptions')

// Import các file routes
const authRoutes = require('./src/routes/authRoutes')
const productRoutes = require('./src/routes/productRoutes')

const app = express()

app.use(cors(corsOptions))

// Middleware xử lý dữ liệu JSON từ request body
app.use(express.json())

app.use(express.urlencoded({ extended: true }))

// Cấu hình URL cơ sở cho phần Auth
app.use('/api/auth', authRoutes)

// Cấu hình URL cho phần Sản phẩm
app.use('/api/products', productRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`)
})
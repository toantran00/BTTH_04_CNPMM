const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { corsOptions } = require('./src/config/corsOptions')

const authRoutes = require('./src/routes/authRoutes')
const productRoutes = require('./src/routes/productRoutes')
const cartRoutes = require('./src/routes/cartRoutes')
const orderRoutes = require('./src/routes/orderRoutes')

const app = express()

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`)
})
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health / Info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Inventory and Data Management System API is running',
    version: '1.0.0',
    documentation: {
      products: 'GET, POST /api/products',
      singleProduct: 'GET, PUT, DELETE /api/products/:id',
      lowStock: 'GET /api/products/low-stock',
      summary: 'GET /api/products/summary',
      stockAdjustment: 'PATCH /api/products/:id/stock'
    }
  });
});

// Mount Routes
app.use('/api/products', productRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

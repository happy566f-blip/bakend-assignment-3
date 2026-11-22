const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategorySummary,
  adjustStock
} = require('../controllers/productController');

// 1. Base routes
router.route('/')
  .get(getAllProducts)
  .post(createProduct);

// 2. Specific routes - MUST precede /:id to prevent route clash
router.get('/low-stock', getLowStockProducts);
router.get('/summary', getCategorySummary);

// 3. Parameterized routes by MongoDB ID
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// 4. Stock adjustment route
router.patch('/:id/stock', adjustStock);

module.exports = router;

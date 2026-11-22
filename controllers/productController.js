const Product = require('../models/Product');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Public
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, price, quantity, reorderLevel, supplier } = req.body;

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      quantity,
      reorderLevel: reorderLevel !== undefined ? reorderLevel : 10,
      supplier
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products with filtering, search, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { category, search, name, minPrice, maxPrice, sortBy, sort, order, page = 1, limit = 10 } = req.query;

    // 1. Build Filter Query
    const filter = {};

    // Filter by Category
    if (category) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Search by Product Name
    const searchTerm = search || name;
    if (searchTerm) {
      filter.name = { $regex: searchTerm.trim(), $options: 'i' };
    }

    // Filter by Price Range (minPrice and/or maxPrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        const parsedMin = Number(minPrice);
        if (!isNaN(parsedMin)) filter.price.$gte = parsedMin;
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        const parsedMax = Number(maxPrice);
        if (!isNaN(parsedMax)) filter.price.$lte = parsedMax;
      }
    }

    // 2. Build Sort Options
    let sortOptions = {};
    if (sortBy) {
      const sortOrder = order && order.toLowerCase() === 'desc' ? -1 : 1;
      sortOptions[sortBy] = sortOrder;
    } else if (sort) {
      // Supports string formats like "price", "-price", "name,quantity"
      const sortFields = sort.split(',').join(' ');
      sortOptions = sortFields;
    } else {
      // Default sort by creation time descending or _id ascending
      sortOptions = { createdAt: -1 };
    }

    // 3. Pagination Setup
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Total matching documents
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNumber) || 1;

    // Fetch Products
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      total,
      page: pageNumber,
      totalPages,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product details and stock information
 * @route   PUT /api/products/:id
 * @access  Public
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product from the database
 * @route   DELETE /api/products/:id
 * @access  Public
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Product deleted',
      id: req.params.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get products with low stock (quantity <= reorderLevel)
 * @route   GET /api/products/low-stock
 * @access  Public
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    res.status(200).json({
      count: lowStockItems.length,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category-wise inventory summary using MongoDB aggregation
 * @route   GET /api/products/summary
 * @access  Public
 */
const getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $project: {
          _id: 1,
          totalItems: 1,
          totalQuantity: 1,
          totalStockValue: 1,
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      categories: summary.length,
      summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Adjust stock safely (restock or sale)
 * @route   PATCH /api/products/:id/stock
 * @access  Public
 */
const adjustStock = async (req, res, next) => {
  try {
    const { change } = req.body;

    // Validate change parameter
    if (change === undefined || typeof change !== 'number' || isNaN(change)) {
      return res.status(400).json({
        message: 'Please provide a valid numeric change value'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newQuantity = product.quantity + change;

    // Prevent stock from becoming negative
    if (newQuantity < 0) {
      return res.status(400).json({
        message: `Insufficient stock. Current quantity is ${product.quantity}, cannot reduce by ${Math.abs(change)}`
      });
    }

    product.quantity = newQuantity;
    await product.save();

    res.status(200).json({
      message: 'Stock updated',
      product
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategorySummary,
  adjustStock
};

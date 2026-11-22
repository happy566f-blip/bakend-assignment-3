const mongoose = require('mongoose');

/**
 * Product Schema
 * Represents an inventory item with validation and computed stock value
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be greater than or equal to 0']
    },
    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
      min: [0, 'Quantity must be greater than or equal to 0']
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level must be greater than or equal to 0']
    },
    supplier: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property for stockValue = price * quantity
productSchema.virtual('stockValue').get(function () {
  return this.price * this.quantity;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Sample product dataset (12 items across 5 distinct categories)
const sampleProducts = [
  // Furniture
  {
    name: 'Study Table',
    sku: 'FURN-TB-812',
    category: 'Furniture',
    price: 3999,
    quantity: 2, // Low stock (quantity <= reorderLevel)
    reorderLevel: 4,
    supplier: 'IKEA India'
  },
  {
    name: 'Ergonomic Mesh Chair',
    sku: 'FURN-CH-301',
    category: 'Furniture',
    price: 6499,
    quantity: 15,
    reorderLevel: 5,
    supplier: 'Featherlite'
  },
  {
    name: 'Wooden Book Shelf',
    sku: 'FURN-SH-104',
    category: 'Furniture',
    price: 4999,
    quantity: 3, // Low stock
    reorderLevel: 5,
    supplier: 'IKEA India'
  },

  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    sku: 'ELEC-HP-101',
    category: 'Electronics',
    price: 2499,
    quantity: 45,
    reorderLevel: 15,
    supplier: 'Boat Lifestyle'
  },
  {
    name: 'USB-C Fast Charging Hub',
    sku: 'ELEC-HB-204',
    category: 'Electronics',
    price: 1899,
    quantity: 30,
    reorderLevel: 10,
    supplier: 'Anker Tech'
  },
  {
    name: 'Mechanical Gaming Keyboard',
    sku: 'ELEC-KB-550',
    category: 'Electronics',
    price: 3299,
    quantity: 8, // Low stock
    reorderLevel: 10,
    supplier: 'Logitech India'
  },
  {
    name: 'Smart Fitness Band Pro',
    sku: 'ELEC-SB-901',
    category: 'Electronics',
    price: 2799,
    quantity: 25,
    reorderLevel: 10,
    supplier: 'Noise India'
  },

  // Stationery
  {
    name: 'Gel Pen Pack of 15',
    sku: 'STNY-PN-713',
    category: 'Stationery',
    price: 120,
    quantity: 40,
    reorderLevel: 20,
    supplier: 'Cello Pens'
  },
  {
    name: 'Hardcover Ruled Notebook A5',
    sku: 'STNY-NB-205',
    category: 'Stationery',
    price: 249,
    quantity: 50,
    reorderLevel: 15,
    supplier: 'Classmate'
  },

  // Apparel
  {
    name: 'Cotton Casual Crewneck T-Shirt',
    sku: 'APPR-TS-401',
    category: 'Apparel',
    price: 699,
    quantity: 50,
    reorderLevel: 20,
    supplier: 'Raymond Garments'
  },
  {
    name: 'Slim Fit Denim Jeans',
    sku: 'APPR-JN-802',
    category: 'Apparel',
    price: 1799,
    quantity: 28,
    reorderLevel: 12,
    supplier: 'Levi Strauss India'
  },

  // Accessories
  {
    name: 'Leather RFID Blocking Wallet',
    sku: 'ACCS-WL-603',
    category: 'Accessories',
    price: 899,
    quantity: 5, // Low stock
    reorderLevel: 10,
    supplier: 'Wildhorn Leather'
  }
];

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('Existing products cleared.');

    // Insert sample products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`Successfully seeded ${createdProducts.length} sample products into MongoDB!`);

    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();

const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function testAll() {
  console.log('========================================');
  console.log('STARTING AUTOMATED API TEST SUITE');
  console.log('========================================\n');

  let createdId = null;
  const results = [];

  const runTest = async (name, fn) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      results.push({ name, passed: true });
    } catch (err) {
      console.error(`[FAIL] ${name} -> ${err.message}`);
      results.push({ name, passed: false, error: err.message });
    }
  };

  // 1. Root API Test
  await runTest('GET / (Root API Info)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.message) throw new Error('Response missing message');
  });

  // 2. Create Product (POST /api/products)
  await runTest('POST /api/products (Create Product)', async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Desk Lamp LED',
        sku: 'ELEC-DL-999',
        category: 'Electronics',
        price: 1299,
        quantity: 20,
        reorderLevel: 5,
        supplier: 'Philips Lighting'
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (!data._id || data.sku !== 'ELEC-DL-999') throw new Error('Product not created properly');
    if (data.stockValue !== 25980) throw new Error(`Expected stockValue 25980, got ${data.stockValue}`);
    createdId = data._id;
  });

  // 3. Duplicate SKU Validation (POST /api/products)
  await runTest('POST /api/products (Duplicate SKU Validation)', async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Lamp',
        sku: 'ELEC-DL-999',
        category: 'Electronics',
        price: 999,
        quantity: 5
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400 for duplicate SKU, got ${res.status}`);
    const data = await res.json();
    if (!data.message || !data.message.includes('already exists')) {
      throw new Error('Expected duplicate SKU error message');
    }
  });

  // 4. Schema Required Field Validation
  await runTest('POST /api/products (Field Validation - Missing Fields & Negative Price)', async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Item',
        price: -50 // Negative price
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400 for invalid data, got ${res.status}`);
  });

  // 5. Get All Products (GET /api/products)
  await runTest('GET /api/products (Get All with Pagination)', async () => {
    const res = await fetch(`${BASE_URL}/api/products?page=1&limit=10`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (typeof data.total !== 'number' || !Array.isArray(data.products)) {
      throw new Error('Invalid response structure for products list');
    }
    if (data.products.length === 0) throw new Error('Expected non-empty products list');
    if (data.products[0].stockValue === undefined) throw new Error('Virtual stockValue is missing');
  });

  // 6. Filter by Category
  await runTest('GET /api/products?category=Furniture (Filter by Category)', async () => {
    const res = await fetch(`${BASE_URL}/api/products?category=Furniture`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    const allFurniture = data.products.every(p => p.category.toLowerCase() === 'furniture');
    if (!allFurniture) throw new Error('Not all returned products belong to Furniture');
  });

  // 7. Search by Name
  await runTest('GET /api/products?search=Table (Search by Product Name)', async () => {
    const res = await fetch(`${BASE_URL}/api/products?search=Table`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.products.length === 0 || !data.products[0].name.includes('Table')) {
      throw new Error('Search failed to return matching products');
    }
  });

  // 8. Filter by Price Range
  await runTest('GET /api/products?minPrice=1000&maxPrice=4000 (Price Range Filter)', async () => {
    const res = await fetch(`${BASE_URL}/api/products?minPrice=1000&maxPrice=4000`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    const inRange = data.products.every(p => p.price >= 1000 && p.price <= 4000);
    if (!inRange) throw new Error('Returned product price outside min/max range');
  });

  // 9. Sort by Price Descending
  await runTest('GET /api/products?sortBy=price&order=desc (Sorting)', async () => {
    const res = await fetch(`${BASE_URL}/api/products?sortBy=price&order=desc&limit=5`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    for (let i = 0; i < data.products.length - 1; i++) {
      if (data.products[i].price < data.products[i + 1].price) {
        throw new Error('Products not sorted by price descending');
      }
    }
  });

  // 10. Low Stock Alert (GET /api/products/low-stock)
  await runTest('GET /api/products/low-stock (Low Stock Alert)', async () => {
    const res = await fetch(`${BASE_URL}/api/products/low-stock`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (typeof data.count !== 'number' || !Array.isArray(data.lowStockItems)) {
      throw new Error('Invalid low-stock response shape');
    }
    const correctlyFiltered = data.lowStockItems.every(p => p.quantity <= p.reorderLevel);
    if (!correctlyFiltered) throw new Error('Low stock filter returned items exceeding reorder level');
  });

  // 11. Category Summary Aggregation (GET /api/products/summary)
  await runTest('GET /api/products/summary (Category-wise Aggregation)', async () => {
    const res = await fetch(`${BASE_URL}/api/products/summary`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (typeof data.categories !== 'number' || !Array.isArray(data.summary)) {
      throw new Error('Invalid summary response structure');
    }
    const sample = data.summary[0];
    if (!sample._id || sample.totalItems === undefined || sample.totalQuantity === undefined || sample.totalStockValue === undefined || sample.avgPrice === undefined) {
      throw new Error('Aggregation item missing required calculated metrics');
    }
  });

  // 12. Get Single Product (GET /api/products/:id)
  await runTest(`GET /api/products/:id (Get Single Product)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data._id !== createdId) throw new Error('Returned product does not match ID');
  });

  // 13. Update Product (PUT /api/products/:id)
  await runTest(`PUT /api/products/:id (Update Product)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: 1499,
        quantity: 25
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.price !== 1499 || data.quantity !== 25) throw new Error('Product not updated correctly');
    if (data.stockValue !== 37475) throw new Error(`Calculated stockValue mismatch: ${data.stockValue}`);
  });

  // 14. Stock Adjustment - Positive (PATCH /api/products/:id/stock)
  await runTest(`PATCH /api/products/:id/stock (Increase Stock)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: 10 })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.product.quantity !== 35) throw new Error(`Expected quantity 35, got ${data.product.quantity}`);
  });

  // 15. Stock Adjustment - Negative Safe (PATCH /api/products/:id/stock)
  await runTest(`PATCH /api/products/:id/stock (Decrease Stock Safely)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: -5 })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.product.quantity !== 30) throw new Error(`Expected quantity 30, got ${data.product.quantity}`);
  });

  // 16. Stock Adjustment - Prevent Negative Stock (PATCH /api/products/:id/stock)
  await runTest(`PATCH /api/products/:id/stock (Prevent Negative Stock)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change: -100 })
    });
    if (res.status !== 400) throw new Error(`Expected 400 when deducting more than current stock, got ${res.status}`);
    const data = await res.json();
    if (!data.message || !data.message.includes('Insufficient stock')) {
      throw new Error(`Expected Insufficient stock message, got: ${data.message}`);
    }
  });

  // 17. Delete Product (DELETE /api/products/:id)
  await runTest(`DELETE /api/products/:id (Delete Product)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}`, {
      method: 'DELETE'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.message !== 'Product deleted' || data.id !== createdId) {
      throw new Error('Invalid delete response');
    }
  });

  // 18. Verify Product Deleted (GET /api/products/:id -> 404)
  await runTest(`GET /api/products/:id (Verify 404 on deleted item)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/${createdId}`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 19. Malformed MongoDB ID (GET /api/products/invalid-id -> 404)
  await runTest(`GET /api/products/123-not-an-id (Invalid ObjectId Handling)`, async () => {
    const res = await fetch(`${BASE_URL}/api/products/123-not-an-id`);
    if (res.status !== 404) throw new Error(`Expected 404 for malformed ObjectId, got ${res.status}`);
  });

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log('========================================');

  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testAll();

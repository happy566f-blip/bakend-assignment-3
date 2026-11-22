# Inventory and Data Management System

**Course:** Web Dev III  
**Unit Covered:** Unit – 3  
**CO Mapping:** CO3  
**Assignment:** Assignment 3 – In-Class Practical Project  

---

## 1. Project Overview

The **Inventory and Data Management System** is a production-grade RESTful backend application built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**. It manages store and warehouse catalogues, supports full CRUD operations, advanced query-string filtering, sorting, pagination, safe stock adjustments, low-stock alerts, and category-wise aggregation reporting.

---

## 2. Technology Stack

- **Node.js** (v18+) – Runtime environment
- **Express.js** (v4.x) – Fast, unopinionated backend web framework
- **MongoDB** – NoSQL document database
- **Mongoose** (v8.x) – Object Data Modeling (ODM) library
- **dotenv** – Secure environment variable configuration

> **Note:** Built strictly adhering to the assignment constraints without any pre-built admin panel, CMS, or external boilerplate.

---

## 3. Project Architecture & Folder Structure

```
inventory-management-system/
│
├── config/
│   └── db.js                 # MongoDB connection using Mongoose
│
├── models/
│   └── Product.js            # Mongoose Product Schema & virtual fields
│
├── controllers/
│   └── productController.js  # Business logic & request controllers
│
├── routes/
│   └── productRoutes.js      # RESTful route definitions
│
├── middleware/
│   └── errorMiddleware.js    # Centralized error handler & 404 middleware
│
├── .env                      # Environment variables (PORT, MONGO_URI)
├── .gitignore                # Git ignore rules
├── server.js                 # Application entry point & Express app setup
├── package.json              # Project dependencies and npm scripts
├── seed.js                   # Database seeder with sample data
├── test-api.js               # Automated comprehensive API test suite
├── postman_collection.json   # Exported Postman collection
└── README.md                 # Complete documentation
```

---

## 4. Product Schema & Field-Level Validation

Defined in [models/Product.js](file:///c:/Users/ADMIN/Desktop/Inventory%20and%20Data%20Management%20System/models/Product.js):

| Field | Type | Validation / Constraints | Default |
|---|---|---|---|
| `name` | String | Required, trimmed | — |
| `sku` | String | Required, unique, trimmed, uppercase | — |
| `category` | String | Required, trimmed | — |
| `price` | Number | Required, minimum: 0 | — |
| `quantity` | Number | Required, minimum: 0 | — |
| `reorderLevel` | Number | Minimum: 0 | `10` |
| `supplier` | String | Trimmed | `""` |
| `createdAt` | Date | Managed by Mongoose timestamps | Auto |
| `updatedAt` | Date | Managed by Mongoose timestamps | Auto |

### Computed Stock Value (Virtual Field)
```javascript
productSchema.virtual('stockValue').get(function () {
  return this.price * this.quantity;
});
```
When serialized to JSON, every product document includes `stockValue` alongside MongoDB's default fields.

---

## 5. Environment Variables Setup

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventoryDB
NODE_ENV=development
```

---

## 6. Installation & Execution Guide

### Prerequisites
- Node.js installed (`node -v`)
- MongoDB running locally on `127.0.0.1:27017`

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed the Database with Realistic Sample Data
Seeds 12 sample products across Electronics, Furniture, Stationery, Apparel, and Accessories:
```bash
npm run seed
```

### Step 3: Run the Development Server
```bash
npm run dev
```
*(Runs with `--watch` mode, auto-reloading on changes)*

Or for standard production start:
```bash
npm start
```

### Step 4: Run the Automated API Test Suite
With the server running, execute:
```bash
npm run test-api
```
*(Runs 19 end-to-end integration tests covering all CRUD, search, filter, sort, pagination, aggregation, and validation edge cases)*

---

## 7. API Endpoints Reference

Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/products` | Create a new product | `201 Created` |
| `GET` | `/api/products` | Get all products (supports search, filter, sort, pagination) | `200 OK` |
| `GET` | `/api/products/:id` | Get single product by MongoDB ID | `200 OK` / `404 Not Found` |
| `PUT` | `/api/products/:id` | Update product details | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/products/:id` | Delete a product | `200 OK` / `404 Not Found` |
| `GET` | `/api/products/low-stock` | Low stock alert report (`quantity <= reorderLevel`) | `200 OK` |
| `GET` | `/api/products/summary` | Category-wise inventory aggregation summary | `200 OK` |
| `PATCH` | `/api/products/:id/stock` | Safely adjust stock (prevents negative quantity) | `200 OK` / `400 Bad Request` |

---

## 8. Detailed API Request & Response Examples

### 1. Create Product
- **URL:** `POST http://localhost:5000/api/products`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```
- **Response:** `201 Created`
```json
{
  "_id": "6741b6c0e816a4c2810a7f14",
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens",
  "createdAt": "2026-11-22T14:13:20.123Z",
  "updatedAt": "2026-11-22T14:13:20.123Z",
  "__v": 0,
  "stockValue": 4800,
  "id": "6741b6c0e816a4c2810a7f14"
}
```

---

### 2. Get All Products (Filtering, Search, Sorting & Pagination)
- **URL:** `GET http://localhost:5000/api/products?page=1&limit=10`
- **Supported Query Parameters:**
  - `category`: Filter by category (e.g. `category=Furniture`)
  - `search` or `name`: Search by product name (e.g. `search=Table`)
  - `minPrice` & `maxPrice`: Filter by price range (e.g. `minPrice=1000&maxPrice=5000`)
  - `sortBy` & `order`: Sort by field and direction (e.g. `sortBy=price&order=desc`)
  - `page` & `limit`: Pagination controls (e.g. `page=1&limit=10`)
- **Response:** `200 OK`
```json
{
  "total": 12,
  "page": 1,
  "totalPages": 2,
  "count": 10,
  "products": [
    {
      "_id": "6741b6c0e816a4c2810a7f01",
      "name": "Study Table",
      "sku": "FURN-TB-812",
      "category": "Furniture",
      "price": 3999,
      "quantity": 2,
      "reorderLevel": 4,
      "supplier": "IKEA India",
      "createdAt": "2026-11-22T14:13:20.100Z",
      "updatedAt": "2026-11-22T14:13:20.100Z",
      "__v": 0,
      "stockValue": 7998,
      "id": "6741b6c0e816a4c2810a7f01"
    }
  ]
}
```

---

### 3. Get Single Product by ID
- **URL:** `GET http://localhost:5000/api/products/:id`
- **Response:** `200 OK` (or `404 Not Found`)

---

### 4. Update Product
- **URL:** `PUT http://localhost:5000/api/products/:id`
- **Request Body:**
```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 140,
  "quantity": 60
}
```
- **Response:** `200 OK`
```json
{
  "_id": "6741b6c0e816a4c2810a7f14",
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 140,
  "quantity": 60,
  "reorderLevel": 20,
  "supplier": "Cello Pens",
  "createdAt": "2026-11-22T14:13:20.123Z",
  "updatedAt": "2026-11-22T14:15:30.450Z",
  "__v": 0,
  "stockValue": 8400,
  "id": "6741b6c0e816a4c2810a7f14"
}
```

---

### 5. Delete Product
- **URL:** `DELETE http://localhost:5000/api/products/:id`
- **Response:** `200 OK`
```json
{
  "message": "Product deleted",
  "id": "6741b6c0e816a4c2810a7f14"
}
```

---

### 6. Low Stock Alert Report
- **URL:** `GET http://localhost:5000/api/products/low-stock`
- **Description:** Returns items where `quantity <= reorderLevel`
- **Response:** `200 OK`
```json
{
  "count": 4,
  "lowStockItems": [
    {
      "_id": "6741b6c0e816a4c2810a7f01",
      "name": "Study Table",
      "sku": "FURN-TB-812",
      "category": "Furniture",
      "price": 3999,
      "quantity": 2,
      "reorderLevel": 4,
      "supplier": "IKEA India",
      "createdAt": "2026-11-22T14:13:20.100Z",
      "updatedAt": "2026-11-22T14:13:20.100Z",
      "__v": 0,
      "stockValue": 7998,
      "id": "6741b6c0e816a4c2810a7f01"
    }
  ]
}
```

---

### 7. Category-wise Inventory Summary (MongoDB Aggregation)
- **URL:** `GET http://localhost:5000/api/products/summary`
- **Description:** Aggregates total items, total quantity, total stock value, and average price per category.
- **Response:** `200 OK`
```json
{
  "categories": 5,
  "summary": [
    {
      "_id": "Accessories",
      "totalItems": 1,
      "totalQuantity": 5,
      "totalStockValue": 4495,
      "avgPrice": 899
    },
    {
      "_id": "Apparel",
      "totalItems": 2,
      "totalQuantity": 78,
      "totalStockValue": 85322,
      "avgPrice": 1249
    },
    {
      "_id": "Electronics",
      "totalItems": 4,
      "totalQuantity": 108,
      "totalStockValue": 218092,
      "avgPrice": 2624
    },
    {
      "_id": "Furniture",
      "totalItems": 3,
      "totalQuantity": 20,
      "totalStockValue": 120480,
      "avgPrice": 5165.67
    },
    {
      "_id": "Stationery",
      "totalItems": 2,
      "totalQuantity": 90,
      "totalStockValue": 17250,
      "avgPrice": 184.5
    }
  ]
}
```

---

### 8. Stock Adjustment (Safe Restock / Sale)
- **URL:** `PATCH http://localhost:5000/api/products/:id/stock`
- **Headers:** `Content-Type: application/json`
- **Restock Example Body (+10):**
```json
{
  "change": 10
}
```
- **Response:** `200 OK`
```json
{
  "message": "Stock updated",
  "product": {
    "_id": "6741b6c0e816a4c2810a7f01",
    "name": "Study Table",
    "sku": "FURN-TB-812",
    "category": "Furniture",
    "price": 3999,
    "quantity": 12,
    "reorderLevel": 4,
    "supplier": "IKEA India",
    "createdAt": "2026-11-22T14:13:20.100Z",
    "updatedAt": "2026-11-22T14:16:12.780Z",
    "__v": 0,
    "stockValue": 47988,
    "id": "6741b6c0e816a4c2810a7f01"
  }
}
```

- **Negative Stock Prevention Example Body (-100 when quantity is 12):**
```json
{
  "change": -100
}
```
- **Response:** `400 Bad Request`
```json
{
  "message": "Insufficient stock. Current quantity is 12, cannot reduce by 100"
}
```

---

## 9. Error Handling & HTTP Status Codes

The application implements a centralized error-handling middleware in [middleware/errorMiddleware.js](file:///c:/Users/ADMIN/Desktop/Inventory%20and%20Data%20Management%20System/middleware/errorMiddleware.js):

| Scenario | HTTP Status Code | Response Format |
|---|---|---|
| Successful resource retrieval/update | `200 OK` | JSON Document / Object |
| Successful resource creation | `201 Created` | Created JSON Document |
| Validation failure / negative values | `400 Bad Request` | `{"message": "..."}` |
| Duplicate SKU (Code 11000) | `400 Bad Request` | `{"message": "Duplicate field value: sku ..."}` |
| Resource not found / Invalid ID | `404 Not Found` | `{"message": "Product not found"}` |
| Unhandled server exceptions | `500 Internal Server Error` | `{"message": "..."}` |

---

## 10. Postman Testing Guide

1. Open **Postman**.
2. Click **Import** in the upper left.
3. Select the file `postman_collection.json` located in the project root.
4. All 8 endpoints with pre-configured headers, query parameters, and sample bodies will be loaded into a collection named **Inventory and Data Management System API**.
5. Start the server (`npm run dev`) and execute requests sequentially.

# AgriMarket API

Base address: `http://localhost:3000/api`
All requests and answers use JSON. Protected routes need the header
`Authorization: Bearer <token>` (the token comes from login/register).
Errors look like `{ "error": "message" }`.

## Auth

| Method | Address | Who | Body / notes | Success |
|---|---|---|---|---|
| POST | `/auth/register` | Everyone | `full_name, email, password, confirm_password, role (buyer\|farmer), farm_name?, location?` | 201 `{ token, user }` |
| POST | `/auth/login` | Everyone | `email, password` | 200 `{ token, user }` |
| GET | `/auth/me` | Logged in | – | 200 user |

## Categories and products

| Method | Address | Who | Notes |
|---|---|---|---|
| GET | `/categories` | Everyone | List of categories |
| GET | `/products` | Everyone | Query: `search`, `category`, `sort` (`price_asc`, `price_desc`, `name`, `newest`), `limit` |
| GET | `/products/:id` | Everyone | One product with farm and category names |
| GET | `/products/mine` | Farmer | The farmer's own products |
| POST | `/products` | Farmer | `name, category_id, price, unit, stock_qty, badge?, icon?, description?` |
| PUT | `/products/:id` | Farmer (own) / Admin | Same fields as POST (+ `is_active`) |
| DELETE | `/products/:id` | Farmer (own) / Admin | Hides the product (`is_active = 0`) |

## Farmers

| Method | Address | Who | Notes |
|---|---|---|---|
| GET | `/farmers` | Everyone | All farms with `product_count` |
| GET | `/farmers/:id` | Everyone | One farm and its products |

## Orders

| Method | Address | Who | Notes |
|---|---|---|---|
| POST | `/orders` | Buyer | `items:[{product_id, quantity}], delivery_address, phone, payment_method (mpesa\|cash)`. Checks stock, adds KSh 100 delivery, reduces stock. |
| GET | `/orders/mine` | Logged in | The buyer's orders with items |
| GET | `/orders/farmer` | Farmer | Order lines that contain the farmer's products |
| PATCH | `/orders/:id/status` | Farmer / Admin | `{ status: pending\|confirmed\|delivered\|cancelled }` |

## Contact

| Method | Address | Who | Body |
|---|---|---|---|
| POST | `/contact` | Everyone | `name, email, subject?, message` |

## Admin (admin token needed for all)

| Method | Address | Notes |
|---|---|---|
| GET | `/admin/stats` | Counts of buyers, farmers, products, orders and order value |
| GET | `/admin/users` | All users |
| DELETE | `/admin/users/:id` | Delete a user (not yourself, not a buyer with orders) |
| GET | `/admin/orders` | All orders |
| PATCH | `/admin/farmers/:id/verify` | `{ verified: true\|false }` |
| GET | `/admin/messages` | Contact messages |

## Status codes used

200 OK · 201 Created · 400 Bad input · 401 Not logged in · 403 Not allowed · 404 Not found · 409 Already exists · 500 Server error

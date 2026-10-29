# AgriMarket data dictionary

Database name: `agrimarket` (MySQL / MariaDB). Created by `backend/database/schema.sql`.

## Relationships

| Relationship | Meaning |
|---|---|
| users 1 — 0..1 farmers | A user with the *farmer* role has one farm profile |
| farmers 1 — N products | A farm lists many products |
| categories 1 — N products | A category groups many products |
| users 1 — N orders | A buyer places many orders |
| orders 1 — N order_items | An order contains many items |
| products 1 — N order_items | A product can appear in many orders |

`order_items` is the link table that turns the many-to-many between orders and products into two one-to-many links.

## users
| Column | Type | Notes |
|---|---|---|
| id | INT, PK, auto | |
| full_name | VARCHAR(100) | |
| email | VARCHAR(120), unique | Used to log in |
| password_hash | VARCHAR(255) | bcrypt hash, never the plain password |
| role | ENUM buyer/farmer/admin | Default buyer |
| phone | VARCHAR(20) | Optional |
| created_at | TIMESTAMP | |

## farmers
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| user_id | INT, FK → users.id, unique | One farm per farmer user |
| farm_name | VARCHAR(120) | |
| location | VARCHAR(120) | County or town |
| description | TEXT | |
| verified | TINYINT(1) | Set by the admin |

## categories
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| name | VARCHAR(60), unique | Vegetables, Fruits, Grains & cereals, Farm staples |
| description | VARCHAR(120) | Short line shown on the Home page |
| icon | VARCHAR(10) | Emoji |

## products
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| farmer_id | INT, FK → farmers.id | Who sells it |
| category_id | INT, FK → categories.id | |
| name | VARCHAR(100) | |
| description | TEXT | |
| price | DECIMAL(10,2) | In KSh, per unit |
| unit | VARCHAR(20) | kg, bunch, piece... |
| stock_qty | INT | Goes down when an order is placed |
| badge | VARCHAR(30) | e.g. Popular, Fresh today |
| icon | VARCHAR(10) | Emoji shown on the card |
| is_active | TINYINT(1) | 0 = removed from the catalogue |
| created_at | TIMESTAMP | |

## orders
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| buyer_id | INT, FK → users.id | |
| total_amount | DECIMAL(10,2) | Items + KSh 100 delivery |
| status | ENUM pending/confirmed/delivered/cancelled | |
| delivery_address | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| payment_method | ENUM mpesa/cash | |
| created_at | TIMESTAMP | |

## order_items
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| order_id | INT, FK → orders.id | Deleted with its order |
| product_id | INT, FK → products.id | |
| quantity | INT | |
| unit_price | DECIMAL(10,2) | Price at the time of ordering (so later price changes do not change old orders) |

## contact_messages
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| name, email | VARCHAR | Sender |
| subject | VARCHAR(150) | Optional |
| message | TEXT | |
| created_at | TIMESTAMP | |

> The shopping cart is kept in the browser (`localStorage`), so it has no table.

-- AgriMarket database schema (MySQL / MariaDB)
-- Import in phpMyAdmin, or run:  npm run setup

CREATE DATABASE IF NOT EXISTS agrimarket CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE agrimarket;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS farmers;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS users;

-- 1. USERS: everyone who can log in (buyer, farmer or admin)
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('buyer','farmer','admin') NOT NULL DEFAULT 'buyer',
  phone         VARCHAR(20),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FARMERS: extra farm details for users whose role is 'farmer' (1 user : 1 farm)
CREATE TABLE farmers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL UNIQUE,
  farm_name   VARCHAR(120) NOT NULL,
  location    VARCHAR(120) NOT NULL,
  description TEXT,
  verified    TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. CATEGORIES: Vegetables, Fruits, Grains & cereals, Farm staples
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(120),
  icon        VARCHAR(10)
);

-- 4. PRODUCTS: produce listed by farmers
CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id   INT NOT NULL,
  category_id INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  unit        VARCHAR(20) NOT NULL DEFAULT 'kg',
  stock_qty   INT NOT NULL DEFAULT 0,
  badge       VARCHAR(30),
  icon        VARCHAR(10),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id)   REFERENCES farmers(id)    ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 5. ORDERS: one order placed by a buyer
CREATE TABLE orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id         INT NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  status           ENUM('pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'pending',
  delivery_address VARCHAR(255) NOT NULL,
  phone            VARCHAR(20) NOT NULL,
  payment_method   ENUM('mpesa','cash') NOT NULL DEFAULT 'mpesa',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

-- 6. ORDER_ITEMS: the produce inside an order (links orders and products)
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 7. CONTACT_MESSAGES: messages sent from the Contact page
CREATE TABLE contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(120) NOT NULL,
  subject    VARCHAR(150),
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the database
CREATE DATABASE IF NOT EXISTS repair_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE repair_shop_db;

-- Create the service orders table
CREATE TABLE IF NOT EXISTS service_orders (
    order_id VARCHAR(20) PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    service_description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create a status history table to keep track of status changes
CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES service_orders(order_id)
);

-- Create a users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: 1234)
-- In a real application, you would use proper password hashing
INSERT INTO users (username, password, role) VALUES ('admin', '1234', 'admin');

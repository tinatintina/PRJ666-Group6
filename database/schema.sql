CREATE DATABASE IF NOT EXISTS smart_spend;
USE smart_spend;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    preferred_currency VARCHAR(10) NOT NULL DEFAULT 'CAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    category_type VARCHAR(20) NOT NULL
);

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    description VARCHAR(255),

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month VARCHAR(20) NOT NULL,
    budget_amount DECIMAL(10,2) NOT NULL,
    remaining_balance DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE financial_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_income DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_expense DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    spending_health_score INT,
    alert_message VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

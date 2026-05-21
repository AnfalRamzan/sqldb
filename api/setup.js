import { pool } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    // Drop tables if exist
    await pool.query(`DROP TABLE IF EXISTS payments`);
    await pool.query(`DROP TABLE IF EXISTS customers`);
    
    // Create customers table
    await pool.query(`
      CREATE TABLE customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        city VARCHAR(100),
        due_amount DECIMAL(15,2) DEFAULT 0,
        total_paid DECIMAL(15,2) DEFAULT 0,
        remaining_due DECIMAL(15,2) DEFAULT 0,
        customer_type VARCHAR(50) DEFAULT 'Customer',
        cnic VARCHAR(50) UNIQUE,
        reference_name VARCHAR(255),
        address TEXT,
        promise_date DATE,
        reason TEXT,
        photo_data TEXT,
        bill_data TEXT,
        book_no VARCHAR(100),
        entry_date DATE DEFAULT (CURDATE()),
        order_amount DECIMAL(15,2) DEFAULT 0,
        advance_amount DECIMAL(15,2) DEFAULT 0,
        issue_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create payments table
    await pool.query(`
      CREATE TABLE payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT,
        amount DECIMAL(15,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        reference_no VARCHAR(255),
        proof_data TEXT,
        payment_date DATE DEFAULT (CURDATE()),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes
    await pool.query(`CREATE INDEX idx_customers_phone ON customers(phone)`);
    await pool.query(`CREATE INDEX idx_customers_promise_date ON customers(promise_date)`);
    await pool.query(`CREATE INDEX idx_customers_entry_date ON customers(entry_date)`);
    await pool.query(`CREATE INDEX idx_customers_remaining_due ON customers(remaining_due)`);
    await pool.query(`CREATE INDEX idx_payments_customer_id ON payments(customer_id)`);
    await pool.query(`CREATE INDEX idx_payments_payment_date ON payments(payment_date)`);
    
    res.status(200).json({ 
      success: true, 
      message: 'MySQL tables created successfully!' 
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
}
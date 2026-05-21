import { pool } from '../lib/db.js';

function getPakistanDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    // GET payments
    if (req.method === 'GET') {
      const { customer_id, today } = req.query;
      
      if (customer_id) {
        const [rows] = await pool.query(
          `SELECT p.*, c.name as customer_name
           FROM payments p
           LEFT JOIN customers c ON p.customer_id = c.id
           WHERE p.customer_id = ?
           ORDER BY p.payment_date DESC`,
          [customer_id]
        );
        return res.status(200).json(rows);
      }
      
      if (today === 'true') {
        const [rows] = await pool.query(
          `SELECT p.*, c.name as customer_name, c.phone as customer_phone
           FROM payments p
           LEFT JOIN customers c ON p.customer_id = c.id
           WHERE p.payment_date = ?
           ORDER BY p.payment_date DESC`,
          [getPakistanDate()]
        );
        return res.status(200).json(rows);
      }
      
      const [rows] = await pool.query(`
        SELECT p.*, c.name as customer_name
        FROM payments p
        LEFT JOIN customers c ON p.customer_id = c.id
        ORDER BY p.payment_date DESC
        LIMIT 500
      `);
      return res.status(200).json(rows);
    }
    
    // POST create payment
    if (req.method === 'POST') {
      const { customer_id, amount, payment_method, reference_no, proof_data, payment_date } = req.body;
      
      const amt = parseFloat(amount);
      if (!customer_id || isNaN(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid data' });
      }
      
      // Check remaining due
      const [customerRows] = await pool.query(
        'SELECT due_amount, total_paid FROM customers WHERE id = ?',
        [customer_id]
      );
      if (customerRows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      const customer = customerRows[0];
      const remainingDue = customer.due_amount - customer.total_paid;
      if (amt > remainingDue) {
        return res.status(400).json({ error: `Cannot exceed remaining due of ${remainingDue}` });
      }
      
      const finalDate = payment_date || getPakistanDate();
      
      await pool.query(
        `INSERT INTO payments (customer_id, amount, payment_method, reference_no, proof_data, payment_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customer_id, amt, payment_method || 'Cash', reference_no, proof_data, finalDate]
      );
      
      // Update customer total_paid and remaining_due
      await pool.query(
        'UPDATE customers SET total_paid = total_paid + ?, remaining_due = due_amount - total_paid WHERE id = ?',
        [amt, customer_id]
      );
      
      const [newPayment] = await pool.query('SELECT * FROM payments WHERE id = LAST_INSERT_ID()');
      return res.status(201).json(newPayment[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
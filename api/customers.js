import { pool } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    // GET all customers
    if (req.method === 'GET') {
      const { due_reminder } = req.query;
      
      if (due_reminder === 'true') {
        const [rows] = await pool.query(`
          SELECT id, name, phone, city, due_amount, total_paid, 
                 remaining_due, promise_date, reference_name
          FROM customers
          WHERE promise_date = CURDATE() AND remaining_due > 0
          ORDER BY name
        `);
        return res.status(200).json(rows);
      }
      
      const [rows] = await pool.query('SELECT * FROM customers ORDER BY id DESC');
      return res.status(200).json(rows);
    }
    
    // POST create customer
    if (req.method === 'POST') {
      const {
        name, phone, city, due_amount, cnic, reference_name, 
        address, promise_date, reason, photo_data, bill_data, 
        book_no, entry_date, total_paid = 0
      } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone required' });
      }
      
      const dueAmt = parseFloat(due_amount) || 0;
      const paidAmt = parseFloat(total_paid) || 0;
      const remaining = dueAmt - paidAmt;
      
      const finalEntry = entry_date || new Date().toISOString().slice(0,10);
      
      const [result] = await pool.query(
        `INSERT INTO customers (
          name, phone, city, due_amount, total_paid, remaining_due,
          cnic, reference_name, address, promise_date, reason,
          photo_data, bill_data, book_no, entry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, phone, city, dueAmt, paidAmt, remaining, cnic, 
         reference_name, address, promise_date, reason, 
         photo_data, bill_data, book_no, finalEntry]
      );
      
      const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
      return res.status(201).json(newCustomer[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'CNIC already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
}
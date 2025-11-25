const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get All Bills
router.get('/bills', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT b.*, p.name as patient_name, p.phone FROM Bill b JOIN Patient p ON b.patient_id = p.patient_id ORDER BY bill_date DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Bill
router.post('/bills', async (req, res) => {
    const { patient_id, amount } = req.body;
    try {
        const [resDb] = await pool.query('INSERT INTO Bill (patient_id, amount, bill_date, status) VALUES (?, ?, NOW(), "Unpaid")', [patient_id, amount]);
        const [newBill] = await pool.query('SELECT b.*, p.name as patient_name, p.phone FROM Bill b JOIN Patient p ON b.patient_id = p.patient_id WHERE b.bill_id = ?', [resDb.insertId]);
        res.json(newBill[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Bill Status
router.patch('/bills/:id', async (req, res) => {
    try {
        await pool.query('UPDATE Bill SET status = ? WHERE bill_id = ?', [req.body.status, req.params.id]);
        res.json({ message: 'Status Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get Bills for Specific Patient
router.get('/bills/patient/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Bill WHERE patient_id = ? ORDER BY bill_date DESC', [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET ALL MEDICINES (Fresh List)
router.get('/medicines', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Medicine ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD NEW MEDICINE
router.post('/medicines', async (req, res) => {
    const { name, type, price, stock } = req.body;
    
    if (!name || !stock) {
        return res.status(400).json({ error: 'Name and Stock are required.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO Medicine (name, type, price, stock) VALUES (?, ?, ?, ?)',
            [name, type || 'Tablet', price || 0, stock]
        );
        
        const [newMed] = await pool.query('SELECT * FROM Medicine WHERE medicine_id = ?', [result.insertId]);
        res.status(201).json(newMed[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE STOCK
router.patch('/medicines/:id', async (req, res) => {
    const { stock } = req.body;
    try {
        await pool.query('UPDATE Medicine SET stock = ? WHERE medicine_id = ?', [stock, req.params.id]);
        const [row] = await pool.query('SELECT * FROM Medicine WHERE medicine_id = ?', [req.params.id]);
        res.json({ medicine: row[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
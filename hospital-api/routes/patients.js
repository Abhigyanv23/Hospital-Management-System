const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. Get All Patients (Includes Compliance Score)
router.get('/patients', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT patient_id, name, age, gender, phone, address, compliance_score FROM Patient');
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2. Get Single Patient
router.get('/patients/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Patient WHERE patient_id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET Medical Records (The Bulletproof Version)
router.get('/records/:id', async (req, res) => {
    try {
        // Use LEFT JOIN so records show up even if Doctor ID is weird
        const [records] = await pool.query(`
            SELECT mr.*, d.name as doctor_name, d.specialization 
            FROM MedicalRecord mr 
            LEFT JOIN Doctor d ON mr.doctor_id = d.doctor_id 
            WHERE mr.patient_id = ? 
            ORDER BY visit_date DESC
        `, [req.params.id]);

        // Fetch Medicines for each specific record
        for (let record of records) {
            try {
                // Query by record_id
                const [meds] = await pool.query(`
                    SELECT p.dosage, p.duration, m.name 
                    FROM Prescription p
                    JOIN Medicine m ON p.medicine_id = m.medicine_id
                    WHERE p.record_id = ? 
                `, [record.record_id]);
                
                record.medicines = meds; 
            } catch (subErr) {
                console.error("Error fetching meds for record:", subErr);
                record.medicines = []; // Default to empty if this sub-query fails
            }
        }

        res.json(records);
    } catch (err) { 
        console.error("Main Record Fetch Error:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// 4. Create Basic Medical Record (Fallback)
router.post('/records', async (req, res) => {
    const { patient_id, doctor_id, appointment_id, diagnosis, notes, treatment_plan, file_path } = req.body;
    try {
        const [resDb] = await pool.query('INSERT INTO MedicalRecord (patient_id, doctor_id, appointment_id, visit_date, diagnosis, notes, treatment_plan, file_path) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)', 
        [patient_id, doctor_id, appointment_id || null, diagnosis, notes, treatment_plan, file_path]);
        res.status(201).json({ record_id: resDb.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Update Patient Compliance Score
router.patch('/patients/:id/compliance', async (req, res) => {
    const { score } = req.body;
    try {
        await pool.query('UPDATE Patient SET compliance_score = ? WHERE patient_id = ?', [score, req.params.id]);
        const [updated] = await pool.query('SELECT * FROM Patient WHERE patient_id = ?', [req.params.id]);
        res.json({ message: 'Compliance updated', patient: updated[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
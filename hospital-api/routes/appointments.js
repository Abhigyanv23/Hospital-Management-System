const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get All Appointments
router.get('/appointments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Appointment ORDER BY appointment_date DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Appointment
router.post('/appointments', async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time, is_emergency } = req.body;
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) return res.status(400).json({ error: 'Missing fields.' });

    try {
        const [exists] = await pool.query('SELECT * FROM Appointment WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?', [doctor_id, appointment_date, appointment_time]);
        if (exists.length > 0) return res.status(409).json({ error: 'Time slot booked.' });

        const [result] = await pool.query('INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time, status, is_emergency) VALUES (?, ?, ?, ?, "Scheduled", ?)', [patient_id, doctor_id, appointment_date, appointment_time, is_emergency || false]);
        
        const [newAppt] = await pool.query('SELECT * FROM Appointment WHERE appointment_id = ?', [result.insertId]);
        res.status(201).json(newAppt[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Appointment
router.patch('/appointments/:id', async (req, res) => {
    const { status, doctor_rating } = req.body;
    let sql = 'UPDATE Appointment SET ';
    let params = [];
    if (status) { sql += 'status = ? '; params.push(status); }
    if (doctor_rating) { sql += (status ? ', ' : '') + 'doctor_rating = ? '; params.push(doctor_rating); }
    sql += 'WHERE appointment_id = ?';
    params.push(req.params.id);

    try {
        await pool.query(sql, params);
        const [updated] = await pool.query('SELECT * FROM Appointment WHERE appointment_id = ?', [req.params.id]);
        res.json({ message: 'Updated', appointment: updated[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Doctor Analytics
router.get('/doctors/analytics/:id', async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT COUNT(appointment_id) as total_appointments, 
            SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as completed_appointments,
            AVG(doctor_rating) as average_rating,
            SUM(CASE WHEN doctor_rating IS NOT NULL THEN 1 ELSE 0 END) as total_ratings
            FROM Appointment WHERE doctor_id = ?`, [req.params.id]);
        
        const [upcoming] = await pool.query('SELECT * FROM Appointment WHERE doctor_id = ? AND status="Scheduled"', [req.params.id]);
        res.json({ stats: stats[0], upcoming_appointments: upcoming });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
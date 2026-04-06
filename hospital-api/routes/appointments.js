const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// --- NEW: IMPORT EMAIL SERVICE ---
const { sendAppointmentConfirmation } = require('../utils/emailService');

// 1. GET ALL APPOINTMENTS
router.get('/appointments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Appointment ORDER BY appointment_date DESC, appointment_time DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. DOCTOR ANALYTICS
router.get('/doctors/analytics/:id', async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_appointments,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_appointments,
                AVG(doctor_rating) as average_rating,
                SUM(CASE WHEN doctor_rating IS NOT NULL THEN 1 ELSE 0 END) as total_ratings
            FROM Appointment WHERE doctor_id = ?
        `, [req.params.id]);

        const [upcoming] = await pool.query(`
            SELECT * FROM Appointment 
            WHERE doctor_id = ? AND status = 'Scheduled' 
            ORDER BY appointment_date ASC LIMIT 5
        `, [req.params.id]);

        res.json({ stats: stats[0], upcoming_appointments: upcoming });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. UPDATE APPOINTMENT (Status, Rating, etc.) -- REAL-TIME ENABLED
router.patch('/appointments/:id', async (req, res) => {
    const { status, doctor_rating } = req.body;
    
    // Dynamic Query Builder
    let sql = 'UPDATE Appointment SET ';
    let params = [];
    if (status) { sql += 'status = ?, '; params.push(status); }
    if (doctor_rating) { sql += 'doctor_rating = ?, '; params.push(doctor_rating); }
    
    // Remove trailing comma and add WHERE clause
    sql = sql.slice(0, -2); 
    sql += ' WHERE appointment_id = ?';
    params.push(req.params.id);

    try {
        // A. Perform Update
        await pool.query(sql, params);

        // B. Fetch the Updated Appointment (to broadcast full details)
        const [updatedAppt] = await pool.query('SELECT * FROM Appointment WHERE appointment_id = ?', [req.params.id]);
        const appointment = updatedAppt[0];

        // --- SOCKET.IO TRIGGERS ---
        const io = req.app.get('io');
        if (io) {
            io.emit('appointment_updated', { 
                appointment_id: appointment.appointment_id,
                status: appointment.status,
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                doctor_rating: appointment.doctor_rating
            });
            console.log(`⚡ Socket: Appointment ${appointment.appointment_id} updated.`);

            if (doctor_rating) {
                io.emit('doctor_updated', { 
                    doctor_id: appointment.doctor_id, 
                    type: 'rating_update' 
                });
                console.log(`⚡ Socket: Doctor ${appointment.doctor_id} rating updated.`);
            }
        }

        res.json({ message: 'Updated', appointment });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 4. CREATE APPOINTMENT -- REAL-TIME & EMAIL ENABLED
router.post('/appointments', async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time, is_emergency, symptoms_raw, symptoms_medical } = req.body;
    
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ error: 'Missing fields.' });
    }

    try {
        // Check for double booking
        const [exists] = await pool.query('SELECT * FROM Appointment WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?', [doctor_id, appointment_date, appointment_time]);
        if (exists.length > 0) return res.status(409).json({ error: 'Time slot booked.' });

        const [result] = await pool.query(
            'INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time, status, is_emergency, symptoms_raw, symptoms_medical) VALUES (?, ?, ?, ?, "Scheduled", ?, ?, ?)', 
            [patient_id, doctor_id, appointment_date, appointment_time, is_emergency || false, symptoms_raw || null, symptoms_medical || null]
        );
        
        const [newAppt] = await pool.query('SELECT * FROM Appointment WHERE appointment_id = ?', [result.insertId]);
        
        // --- 🔴 NEW: TRIGGER CONFIRMATION EMAIL ---
        try {
            // Get the names and emails needed for the template
            const [patientData] = await pool.query('SELECT name, email FROM Patient WHERE patient_id = ?', [patient_id]);
            const [doctorData] = await pool.query('SELECT name FROM Doctor WHERE doctor_id = ?', [doctor_id]);

            if (patientData.length > 0 && doctorData.length > 0 && patientData[0].email) {
                // Fire off the email asynchronously!
                sendAppointmentConfirmation(
                    patientData[0].email, 
                    patientData[0].name, 
                    doctorData[0].name, 
                    appointment_date, 
                    appointment_time
                );
            }
        } catch (emailError) {
            console.error("Failed to send confirmation email (appointment still saved):", emailError);
        }

        // --- SOCKET.IO TRIGGER ---
        const io = req.app.get('io');
        if(io) {
            io.emit('appointment_updated', { 
                message: 'New Appointment Created',
                patient_id: patient_id,
                doctor_id: doctor_id
            });
        }

        res.status(201).json(newAppt[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
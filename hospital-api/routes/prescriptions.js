const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/prescriptions', async (req, res) => {
    const { patient_id, doctor_id, appointment_id, diagnosis, notes, treatment_plan, medicines } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Create Medical Record
        const [recordRes] = await connection.query(
            'INSERT INTO MedicalRecord (patient_id, doctor_id, appointment_id, visit_date, diagnosis, notes, treatment_plan) VALUES (?, ?, ?, NOW(), ?, ?, ?)',
            [patient_id, doctor_id, appointment_id || null, diagnosis, notes, treatment_plan]
        );
        
        const newRecordId = recordRes.insertId;

        // 2. Handle Medicines
        if (medicines && medicines.length > 0) {
            for (const med of medicines) {
                
                // A. Deduct Stock
                await connection.query(
                    'UPDATE Medicine SET stock = stock - ? WHERE medicine_id = ?', 
                    [med.quantity, med.medicine_id]
                );

                // B. Save Prescription (LINKED TO RECORD ID)
                await connection.query(
                    'INSERT INTO Prescription (record_id, appointment_id, medicine_id, dosage, duration) VALUES (?, ?, ?, ?, ?)',
                    [newRecordId, appointment_id || null, med.medicine_id, med.dosage, med.duration]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Success', record_id: newRecordId });

    } catch (error) {
        await connection.rollback();
        console.error("Transaction Failed:", error.message);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
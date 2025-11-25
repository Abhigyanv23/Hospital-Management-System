const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const twilio = require('twilio');

// --- TWILIO CONFIGURATION ---
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // Keep placeholder for now
const authToken = 'YOUR_TWILIO_AUTH_TOKEN'; 
const twilioPhoneNumber = 'YOUR_TWILIO_PHONE_NUMBER';

const JWT_SECRET = 'your_super_secret_hospital_key_2025';

// --- SAFE TWILIO INITIALIZATION ---
let client = null;
if (accountSid.startsWith('AC')) {
    client = new twilio(accountSid, authToken);
} else {
    console.log("⚠️ Twilio credentials not found. Running in MOCK MODE (OTPs will appear in console).");
}

// --- IN-MEMORY OTP STORE ---
const otpStore = {}; 

// 1. SEND OTP ROUTE
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
        return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits.' });
    }

    try {
        const [exists] = await pool.query('SELECT * FROM Patient WHERE phone = ?', [phone]);
        if (exists.length > 0) {
            return res.status(409).json({ error: 'Phone number already registered. Please login.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP
        otpStore[phone] = otp;

        // --- SENDING LOGIC ---
        if (client) {
            // REAL MODE: Send SMS
            await client.messages.create({
                body: `Your Hospital Code: ${otp}`,
                from: twilioPhoneNumber,
                to: `+91${phone}`
            });
            console.log(`[Twilio] OTP sent to ${phone}`);
        } else {
            // MOCK MODE: Log to Console
            console.log(`=============================================`);
            console.log(`🔐 [MOCK OTP] For ${phone}: ${otp}`);
            console.log(`=============================================`);
        }

        res.json({ message: 'OTP sent successfully!' });

    } catch (error) {
        console.error("OTP Error:", error);
        // Even if Twilio fails, we return success in dev mode so you can test
        res.status(500).json({ error: 'Failed to send OTP.' });
    }
});

// 2. REGISTER PATIENT (With OTP Verification)
router.post('/patients', async (req, res) => {
    const { name, age, gender, phone, address, password, otp } = req.body;

    if (!name || !phone || !password || !otp) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Verify OTP
    if (otpStore[phone] !== otp) {
        return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO Patient (name, age, gender, phone, address, password_hash) VALUES (?, ?, ?, ?, ?, ?)', 
            [name, age, gender, phone, address, hash]
        );

        delete otpStore[phone]; // Clear OTP

        res.status(201).json({ 
            patient_id: result.insertId, 
            name, 
            phone 
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Phone number already exists.' });
        }
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// 3. EXISTING LOGIN ROUTES
router.post('/patients/login', async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Required fields missing.' });

    try {
        const [patients] = await pool.query('SELECT * FROM Patient WHERE phone = ?', [phone]);
        if (patients.length === 0) return res.status(404).json({ error: 'Invalid credentials.' });

        const match = await bcrypt.compare(password, patients[0].password_hash);
        if (match) {
            const token = jwt.sign({ userId: patients[0].patient_id, role: 'Patient', name: patients[0].name }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ user: { patient_id: patients[0].patient_id, name: patients[0].name, role: 'Patient' }, token });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed.' });
    }
});

router.post('/staff/login', async (req, res) => {
    const { role, id, password } = req.body;
    if (!id || !password || !role) return res.status(400).json({ error: 'Missing credentials.' });

    try {
        const table = role === 'Doctor' ? 'Doctor' : 'Staff';
        const idColumn = role === 'Doctor' ? 'doctor_id' : 'staff_id';

        const [users] = await pool.query(`SELECT * FROM ${table} WHERE ${idColumn} = ?`, [id]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found.' });

        const match = await bcrypt.compare(password, users[0].password_hash);
        if (match) {
            const token = jwt.sign({ userId: users[0][idColumn], role: role, name: users[0].name }, JWT_SECRET, { expiresIn: '12h' });
            res.json({ user: { id: users[0][idColumn], name: users[0].name, role: role }, token });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed.' });
    }
});

// ==========================================
// 🛠️ EMERGENCY RESET ROUTE (One-Time Use)
// ==========================================
router.get('/reset-all-passwords', async (req, res) => {
    try {
        console.log("🔄 Starting password reset...");
        
        // 1. Generate a fresh hash for 'password123'
        const newHash = await bcrypt.hash('password123', 10);

        // 2. Update EVERY Doctor
        await pool.query('UPDATE Doctor SET password_hash = ?', [newHash]);
        console.log("✅ Doctors updated.");

        // 3. Update EVERY Staff member
        await pool.query('UPDATE Staff SET password_hash = ?', [newHash]);
        console.log("✅ Staff updated.");

        // 4. Update EVERY Patient
        await pool.query('UPDATE Patient SET password_hash = ?', [newHash]);
        console.log("✅ Patients updated.");

        res.send(`
            <h1 style="color: green;">Success!</h1>
            <p>All passwords have been reset to: <b>password123</b></p>
            <p>You can now log in as ANY doctor or staff member.</p>
        `);
    } catch (error) {
        console.error("Reset Failed:", error);
        res.status(500).send('Error: ' + error.message);
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config();

// --- NEW: IMPORT OUR EMAIL SERVICE ---
const { sendWelcomeEmail } = require('../utils/emailService');

// ==========================================
// 📱 TWILIO CONFIGURATION (For SMS OTP)
// ==========================================
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; 
const authToken = 'YOUR_TWILIO_AUTH_TOKEN'; 
const twilioPhoneNumber = 'YOUR_TWILIO_PHONE_NUMBER';

const JWT_SECRET = 'your_super_secret_hospital_key_2025';

let client = null;
if (accountSid.startsWith('AC')) {
    client = new twilio(accountSid, authToken);
} else {
    console.log("⚠️ Twilio credentials not found. Running in MOCK MODE (SMS OTPs will appear in console).");
}

const otpStore = {}; // In-Memory store for SMS OTPs

// ==========================================
// 📧 NODEMAILER CONFIGURATION (For Email Reset)
// ==========================================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendResetEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Pulse HMS Support" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Password Reset Request - Pulse HMS',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4F46E5;">Password Reset Request</h2>
                <p>You requested to reset your password. Your One-Time Password (OTP) is:</p>
                <h1 style="background: #f3f4f6; padding: 10px 20px; display: inline-block; letter-spacing: 5px; border-radius: 8px;">${otp}</h1>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Reset Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error("❌ Email Error:", error);
        return false;
    }
};

// ==========================================
// 1. REGISTRATION ROUTES
// ==========================================

// Send SMS OTP
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits.' });

    try {
        // 🔴 LOWERCASE FIX applied here
        const [exists] = await pool.query('SELECT * FROM patient WHERE phone = ?', [phone]);
        if (exists.length > 0) return res.status(409).json({ error: 'Phone number already registered. Please login.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[phone] = otp;

        if (client) {
            await client.messages.create({ body: `Your Hospital Code: ${otp}`, from: twilioPhoneNumber, to: `+91${phone}` });
        } else {
            console.log(`=============================================`);
            console.log(`🔐 [MOCK SMS OTP] For ${phone}: ${otp}`);
            console.log(`=============================================`);
        }
        res.json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ error: 'Failed to send OTP.' });
    }
});

// Register Patient
router.post('/patients', async (req, res) => {
    const { name, email, age, gender, phone, address, password, otp } = req.body;
    
    if (!name || !email || !phone || !password || !otp) return res.status(400).json({ error: 'Missing required fields.' });

    if (otpStore[phone] !== otp) return res.status(400).json({ error: 'Invalid or expired OTP.' });

    try {
        const hash = await bcrypt.hash(password, 10);
        
        // 🔴 LOWERCASE FIX applied here
        const [result] = await pool.query(
            'INSERT INTO patient (name, email, age, gender, phone, address, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [name, email, age, gender, phone, address, hash]
        );
        delete otpStore[phone]; 

        sendWelcomeEmail(email, name);

        res.status(201).json({ patient_id: result.insertId, name, phone, email });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage && error.sqlMessage.includes('email')) {
                return res.status(409).json({ error: 'Email already registered.' });
            }
            return res.status(409).json({ error: 'Phone number already registered.' });
        }
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// ==========================================
// 2. LOGIN ROUTES
// ==========================================

router.post('/patients/login', async (req, res) => {
    const { phone, password } = req.body; 
    if (!phone || !password) return res.status(400).json({ error: 'Required fields missing.' });

    try {
        const isEmail = phone.includes('@');
        // 🔴 LOWERCASE FIX applied here
        const query = isEmail ? 'SELECT * FROM patient WHERE email = ?' : 'SELECT * FROM patient WHERE phone = ?';
        
        const [patients] = await pool.query(query, [phone]);
        if (patients.length === 0) return res.status(404).json({ error: 'Invalid credentials.' });

        const match = await bcrypt.compare(password, patients[0].password_hash);
        if (match) {
            const token = jwt.sign({ userId: patients[0].patient_id, role: 'Patient', name: patients[0].name }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ user: { patient_id: patients[0].patient_id, name: patients[0].name, role: 'Patient' }, token });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (err) { 
        console.log("🚨 REAL LOGIN ERROR:", err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

router.post('/staff/login', async (req, res) => {
    const { role, id, password } = req.body; 
    if (!id || !password || !role) return res.status(400).json({ error: 'Missing credentials.' });

    try {
        // 🔴 LOWERCASE FIX applied here
        const table = role === 'Doctor' ? 'doctor' : 'staff'; 
        const idColumn = role === 'Doctor' ? 'doctor_id' : 'staff_id';

        const isEmail = id.includes('@');
        const query = isEmail ? `SELECT * FROM ${table} WHERE email = ?` : `SELECT * FROM ${table} WHERE ${idColumn} = ?`;

        const [users] = await pool.query(query, [id]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found.' });

        const match = await bcrypt.compare(password, users[0].password_hash);
        if (match) {
            const token = jwt.sign({ userId: users[0][idColumn], role: role, name: users[0].name }, JWT_SECRET, { expiresIn: '12h' });
            res.json({ user: { id: users[0][idColumn], name: users[0].name, role: role }, token });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (err) { 
        console.log("🚨 REAL LOGIN ERROR:", err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// ==========================================
// 3. FORGOT PASSWORD ROUTES
// ==========================================

router.post('/forgot-password', async (req, res) => {
    const { email, role } = req.body;

    // 🔴 LOWERCASE FIX applied here
    let table = 'patient';
    if (role.toLowerCase() === 'doctor') table = 'doctor';
    if (role.toLowerCase() === 'staff' || role.toLowerCase() === 'receptionist') table = 'staff';

    try {
        const [exists] = await pool.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
        if (exists.length === 0) return res.status(404).json({ error: 'Email not found.' });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); 

        const emailSent = await sendResetEmail(email, otp);
        if (!emailSent) return res.status(500).json({ error: 'Failed to send email. Check SMTP config.' });

        // 🔴 LOWERCASE FIX applied here
        await pool.query(
            'INSERT INTO passwordreset (email, otp, role, expires_at) VALUES (?, ?, ?, ?)',
            [email, otp, role, expiresAt]
        );

        res.json({ message: `Reset code sent to ${email}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword, role } = req.body;

    // 🔴 LOWERCASE FIX applied here
    let table = 'patient';
    if (role.toLowerCase() === 'doctor') table = 'doctor';
    if (role.toLowerCase() === 'staff' || role.toLowerCase() === 'receptionist') table = 'staff';

    try {
        // 🔴 LOWERCASE FIX applied here
        const [records] = await pool.query(
            'SELECT * FROM passwordreset WHERE email = ? AND otp = ? AND role = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp, role]
        );

        if (records.length === 0) return res.status(400).json({ error: 'Invalid or Expired OTP' });

        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query(`UPDATE ${table} SET password_hash = ? WHERE email = ?`, [hash, email]);
        
        // 🔴 LOWERCASE FIX applied here
        await pool.query('DELETE FROM passwordreset WHERE email = ?', [email]);

        res.json({ message: 'Password Reset Successful. Please Login.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ==========================================
// 🛠️ EMERGENCY RESET ROUTE 
// ==========================================
router.get('/reset-all-passwords', async (req, res) => {
    try {
        const newHash = await bcrypt.hash('password123', 10);
        // 🔴 LOWERCASE FIX applied here
        await pool.query('UPDATE doctor SET password_hash = ?', [newHash]);
        await pool.query('UPDATE staff SET password_hash = ?', [newHash]);
        await pool.query('UPDATE patient SET password_hash = ?', [newHash]);
        res.send(`<h1 style="color: green;">Success! All passwords reset to: password123</h1>`);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

module.exports = router;
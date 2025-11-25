// --- HOSPITAL MANAGEMENT SYSTEM API (Refactored) ---
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const billingRoutes = require('./routes/billing');
const inventoryRoutes = require('./routes/inventory');
const uploadRoutes = require('./routes/uploads');
const analyticsRoutes = require('./routes/analytics');
const doctorRoutes = require('./routes/doctors');
const prescriptionRoutes = require('./routes/prescriptions');

const app = express();
const PORT = 3001;
const FRONTEND_URL = 'http://localhost:5173';

// Middleware
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use Routes
// Note: We mount them at '/api' so the frontend paths (e.g., /api/patients) match.
app.use('/api', authRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', patientRoutes);
app.use('/api', billingRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', uploadRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', doctorRoutes);
app.use('/api', prescriptionRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send({ message: 'Hospital API Running (Modular Version)' });
});

// --- TEMPORARY RESET ROUTE (Delete after use) ---
const bcrypt = require('bcrypt'); // Ensure bcrypt is imported at the top, or re-require here
app.get('/api/reset-all', async (req, res) => {
  try {
    // 1. Generate a FRESH hash for 'password123'
    const newHash = await bcrypt.hash('password123', 10);

    // 2. Update EVERY Doctor
    await pool.query('UPDATE Doctor SET password_hash = ?', [newHash]);
    
    // 3. Update EVERY Staff member
    await pool.query('UPDATE Staff SET password_hash = ?', [newHash]);

    // 4. Update EVERY Patient (Optional, keeps things consistent)
    await pool.query('UPDATE Patient SET password_hash = ?', [newHash]);

    res.send(`
      <h1>✅ Success!</h1>
      <p>All Doctors, Staff, and Patients now have the password: <b>password123</b></p>
      <p>You can now delete this route from server.js.</p>
    `);
  } catch (error) {
    res.status(500).send('Error resetting passwords: ' + error.message);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`📡 Hospital API running on port ${PORT}`);
  console.log(`   Front-end accessible at: ${FRONTEND_URL}`);
});
const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Configure your SMTP Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Reminder: Use a Gmail "App Password", not your real password!
    },
});

// 2. Welcome Email Function
const sendWelcomeEmail = async (patientEmail, patientName) => {
    try {
        await transporter.sendMail({
            from: `"City Hospital" <${process.env.SMTP_USER}>`,
            to: patientEmail,
            subject: "Welcome to City Hospital Portal 🏥",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5;">Welcome, ${patientName}!</h2>
                    <p>Your patient portal account has been successfully created.</p>
                    <p>You can now log in to book appointments, view your medical history, and check your prescriptions.</p>
                    <br/>
                    <p>Stay healthy,</p>
                    <p><b>The City Hospital Team</b></p>
                </div>
            `,
        });
        console.log(`✉️ Welcome email sent to ${patientEmail}`);
    } catch (error) {
        console.error("Email Error:", error);
    }
};

// 3. Appointment Confirmation Function
const sendAppointmentConfirmation = async (patientEmail, patientName, doctorName, date, time) => {
    try {
        await transporter.sendMail({
            from: `"City Hospital" <${process.env.SMTP_USER}>`,
            to: patientEmail,
            subject: "Appointment Confirmed ✅",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #059669;">Appointment Confirmed!</h2>
                    <p>Hi ${patientName},</p>
                    <p>Your appointment has been successfully scheduled.</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><b>Doctor:</b> Dr. ${doctorName}</p>
                        <p><b>Date:</b> ${date}</p>
                        <p><b>Time:</b> ${time}</p>
                    </div>
                    <p>Please arrive 10 minutes early.</p>
                </div>
            `,
        });
        console.log(`✉️ Appointment confirmation sent to ${patientEmail}`);
    } catch (error) {
        console.error("Email Error:", error);
    }
};

module.exports = { sendWelcomeEmail, sendAppointmentConfirmation };
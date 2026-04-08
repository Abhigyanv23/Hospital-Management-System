require('dotenv').config();

// ==========================================
// 📧 MASTER EMAILJS SERVICE HUB
// ==========================================

// 1. Core Engine: Sends emails via EmailJS REST API
const sendEmailJS = async (template_id, template_params) => {
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: template_id,
                user_id: process.env.EMAILJS_PUBLIC_KEY, 
                accessToken: process.env.EMAILJS_PRIVATE_KEY, // Required for backend calls
                template_params: template_params
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ EmailJS Error [${template_id}]:`, errorText);
            return false;
        }

        console.log(`✅ Email sent successfully via EmailJS [${template_id}]`);
        return true;
    } catch (error) {
        console.error("❌ Network Error:", error);
        return false;
    }
};

// ==========================================
// 🚀 EMAIL TRIGGERS
// ==========================================

// 2. Welcome Email Function
const sendWelcomeEmail = async (patientEmail, patientName) => {
    // Note: Make sure your EmailJS Welcome Template has {{patient_name}} and {{to_email}} tags
    return await sendEmailJS(process.env.EMAILJS_TEMPLATE_WELCOME, {
        to_email: patientEmail,
        patient_name: patientName
    });
};

// 3. Appointment Confirmation Function
const sendAppointmentConfirmation = async (patientEmail, patientName, doctorName, date, time) => {
    // Note: Make sure your EmailJS Appointment Template has these exact tags
    return await sendEmailJS(process.env.EMAILJS_TEMPLATE_APPT, {
        to_email: patientEmail,
        patient_name: patientName,
        doctor_name: doctorName,
        appointment_date: date,
        appointment_time: time
    });
};

module.exports = { 
    sendWelcomeEmail, 
    sendAppointmentConfirmation,
    sendEmailJS // Exporting the core engine so auth.js can use it!
};
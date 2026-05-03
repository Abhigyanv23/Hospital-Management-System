# Pulse HMS — Hospital Management System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-success" />
  <img src="https://img.shields.io/badge/Frontend-React.js-blue?logo=react" />
  <img src="https://img.shields.io/badge/Backend-Node.js-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Database-MySQL-orange?logo=mysql" />
  <img src="https://img.shields.io/badge/Auth-JWT-black" />
  <img src="https://img.shields.io/badge/Hosted%20On-Render-purple" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" />
  <img src="https://img.shields.io/badge/API-REST-orange" />
<img src="https://img.shields.io/badge/Architecture-MVC-blue" />
</p>

Pulse HMS is a production-grade, full-stack healthcare platform designed to streamline hospital operations. It implements secure authentication, transactional workflows, and role-based portals for Doctors, Receptionists, and Patients.

The system focuses on real-world hospital workflows such as appointment scheduling, billing, inventory tracking, prescription management, and digital medical records.

---

# Key Features

## Architecture, Security & Infrastructure

### MVC Backend Architecture
- Modular Node.js and Express backend  
- Structured architecture using:
  /routes
/controllers
/utils
/config

- Designed for scalability and maintainability

### Cloud-Resilient Email Architecture
- Fully decoupled Email Hub powered by EmailJS REST API  
- Designed to bypass strict IPv6/SMTP firewall limitations  
- Ensures reliable email delivery in cloud-hosted environments  

### Universal Notification System
Dynamic templates supporting:
- Registration OTPs  
- Password Reset OTPs  
- Welcome Emails  
- Appointment Reminders  

### Authentication & Security
- JWT-based session management  
- Bcrypt password hashing  
- Time-limited OTP-based verification  
- Secure password recovery workflows  

---

# Doctor Portal

Designed to support clinical workflows and patient management.

## Features:
- Live analytics dashboard tracking:
- Average ratings  
- Patient volume  
- Completed visits  

- Smart prescription system:
- Automatically deducts medicines from central inventory  
- Maintains accurate stock records  

- Digital medical records:
- Add diagnosis and treatment plans  
- Upload attachments such as X-Rays and Lab Reports  

- Patient directory:
- Searchable patient history  
- Quick access to historical medical records  

- Compliance tracking:
- Compliance Score (0–100)  
- Tracks patient adherence to treatment plans  

---

# Receptionist (Admin) Console

Built to manage hospital operations and administrative workflows.

## Features:
- Operational analytics:
- Charts displaying peak visiting hours  
- Helps optimize staffing  

- Inventory management:
- Real-time pharmacy stock tracking  
- Automatic updates from prescriptions  
- Low-stock alerts  

- Billing system:
- Generate invoices  
- Track payment status (Paid / Unpaid)  

- Appointment manager:
- Global scheduling interface  
- Administrative controls:
  - Mark Completed  
  - Cancel  
  - Flag No Shows  

---

# Patient Portal

Designed to improve patient accessibility and transparency.

## Features:
- Smart appointment scheduling:
- Book appointments within hourly slots  
- Available between 10 AM and 10 PM  

- Conflict prevention:
- Prevents double booking  
- Prevents overbooking  
- Prevents past-date selection  

- Medical history access:
- View diagnosis records  
- Includes medicine dosage and duration  

- Doctor transparency:
- View doctor ratings  
- Check specialties before booking  

- Report export:
- Download billing and medical summaries  
- Export format: `.txt`

---

# Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React.js (Vite), Tailwind CSS, Lucide React |
| Backend | Node.js, Express.js |
| Database | MySQL (Relational Database, Foreign Keys, ACID Transactions) |
| Authentication | JSON Web Tokens (JWT), Bcrypt |
| Communication | EmailJS REST API |
| File Uploads | Multer |
| Hosting | Render |

---

# Security Highlights

- Role-Based Access Control (RBAC)  
- JWT Authentication  
- Bcrypt Password Hashing  
- OTP-based Email Verification  
- Transaction-safe MySQL Operations  

---

# Core System Modules

- Authentication System  
- Appointment Scheduling  
- Medical Records Management  
- Billing System  
- Inventory Management  
- Notification System  
- Analytics Dashboard  

---

# Deployment

Hosted using:

- Render (Cloud Deployment)  
- EmailJS REST API for communication  

---

# Screenshots

(Add screenshots of your system here)

## Doctor Dashboard
![Doctor Dashboard](screenshots/doctor-dashboard.png)

## Patient Portal
![Patient Portal](screenshots/patient-portal.png)

## Admin Console
![Admin Console](screenshots/admin-console.png)

---

# Project Goals

- Build a production-ready healthcare platform  
- Demonstrate full-stack architecture design  
- Implement secure authentication workflows  
- Develop transactional healthcare systems  
- Showcase scalable backend architecture  

---

# Author

**Abhigyan**

Full-stack developer with interests in scalable systems, real-world backend architecture, and production-grade application design.

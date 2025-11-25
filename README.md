#  Pulse: Hospital Management System

**Pulse HMS** is a production-grade, full-stack healthcare platform designed to streamline hospital operations. It features Role-Based Access Control (RBAC) with distinct, secure portals for **Doctors**, **Receptionists**, and **Patients**, backed by a transactional database system.

![Status](https://img.shields.io/badge/Status-Completed-success?style=flat&logo=git)
![Stack](https://img.shields.io/badge/Stack-MERN_(MySQL)-blue?style=flat&logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

##  Key Features

###  Architecture & Security
* **MVC Backend:** Modular Node.js/Express architecture (`routes/`, `controllers/`, `config/`).
* **Centralized API:** robust frontend service layer for clean data fetching.
* **Security:** `Bcrypt` password hashing and `JWT` (JSON Web Token) authentication.
* **OTP Verification:** Twilio-integrated mobile verification for patient registration.

###  Doctor Portal
* **Live Analytics:** Dashboard tracking average ratings, patient volume, and completed visits.
* **Smart Prescriptions:** Transactional system that deducts medicine from **Inventory** instantly upon prescription.
* **Digital Medical Records:** Create diagnoses, treatment plans, and upload attachments (X-Rays/Reports).
* **Patient Directory:** Searchable history of all treated patients with one-click access to records.
* **Compliance Tracking:** Unique "Compliance Score" system (0-100) to monitor patient adherence.

###  Receptionist (Admin) Console
* **Operational Analytics:** Visual charts for **"Peak Visiting Hours"**.
* **Inventory Management:** Real-time stock tracking with auto-sync and low-stock alerts.
* **Billing System:** Generate invoices with patient search and track status (Paid/Unpaid).
* **Appointment Manager:** Global schedule view with options to Mark Completed, Cancel, or flag "No Shows".

###  Patient Portal
* **Smart Scheduling:** Book appointments with specific hourly slots (10 AM - 10 PM).
* **Conflict Prevention:** Backend logic prevents double-booking or past-date selection.
* **Medical History:** View full diagnosis history, including specific **Medicine Dosages & Durations**.
* **Transparency:** View Doctor Star Ratings before booking.
* **Report Export:** One-click download of medical and billing history (`.txt` summary).

---

##  Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (Relational Data, Foreign Keys, ACID Transactions) |
| **Auth** | JSON Web Tokens (JWT), Bcrypt, Twilio (OTP) |
| **Tools** | Multer (File Uploads), REST API |

---

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// 1. Configure Cloudinary Credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Multer to send files straight to Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pulse-hms-medical-files', // This folder will auto-create in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], // Secures your backend
    },
});

const upload = multer({ storage });

// 3. The Upload Route
router.post('/upload', upload.single('medicalFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    // req.file.path now contains the permanent, secure Cloudinary URL!
    console.log("✅ File secured in Cloudinary:", req.file.path);
    
    res.json({ 
        message: 'Uploaded', 
        filePath: req.file.path 
    });
});

module.exports = router;
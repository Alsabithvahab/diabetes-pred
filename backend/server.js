const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const predictionRoutes = require('./routes/predictionRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
app.use(cors({
    origin: [
        'https://diabetes-admin-panel.web.app',
        'https://diabetes-admin-panel.firebaseapp.com',
        'https://diabetes-pred-f3d59.web.app',
        'https://diabetes-pred-f3d59.firebaseapp.com',
        'https://diabetes-admin-f3d59.web.app',
        'https://diabetes-admin-f3d59.firebaseapp.com',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept', 'X-Requested-With']
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', db: global.dbConnected }));

// Catch-all 404 handler for debugging
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found on this server` });
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diabetes_db_new';

global.dbConnected = false;

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        global.dbConnected = true;
        console.log('MongoDB Connected');
    })
    .catch(err => {
        console.log('MongoDB connection failed. Using local JSON fallback mode.');
    })
    .finally(() => {
        app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
    });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const predictionRoutes = require('./routes/predictionRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
app.use(cors({
    origin: ['https://diabetes-admin-panel.web.app', 'https://diabetes-pred-f3d59.web.app', 'https://diabetes-backend-hfw2.onrender.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);

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

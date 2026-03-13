const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const predictionRoutes = require('./routes/predictionRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

// VERBOSE LOGGING - Must be at the very top
app.use((req, res, next) => {
    console.log(`>>> INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
    console.log(`>>> ORIGIN: ${req.get('origin')}`);
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://diabetes-admin-panel.web.app',
            'https://diabetes-admin-panel.firebaseapp.com',
            'https://diabetes-pred-f3d59.web.app',
            'https://diabetes-pred-f3d59.firebaseapp.com',
            'https://diabetes-admin-f3d59.web.app',
            'https://diabetes-admin-f3d59.firebaseapp.com',
            'http://localhost:3000'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('web.app') || origin.includes('firebaseapp.com')) {
            callback(null, true);
        } else {
            console.warn(`>>> CORS REJECTED ORIGIN: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept', 'X-Requested-With', 'Origin']
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);

// Root routes
app.get('/', (req, res) => res.send('Diabetes Backend API is running...'));
app.get('/health', (req, res) => res.json({ status: 'ok', db: global.dbConnected, env: process.env.NODE_ENV }));

// Catch-all 404 handler for debugging (must be last)
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'ROUTE_NOT_FOUND',
        requestedUrl: req.originalUrl,
        method: req.method,
        message: `The requested route ${req.method} ${req.originalUrl} does not exist on this server.`
    });
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

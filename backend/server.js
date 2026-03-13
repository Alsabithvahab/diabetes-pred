const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const predictionRoutes = require('./routes/predictionRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

// Trust Render's proxy (Cloudflare) - CRITICAL for avoiding 403
app.set('trust proxy', 1);

// Explicit preflight handler - runs BEFORE everything
app.options('*', (req, res) => {
    res.set({
        'Access-Control-Allow-Origin': req.get('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, Accept, X-Requested-With, Origin',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    });
    res.status(204).end();
});

// VERBOSE LOGGING
app.use((req, res, next) => {
    console.log(`>>> ${req.method} ${req.originalUrl} from ${req.get('origin') || 'no-origin'}`);
    next();
});

app.use(cors({
    origin: true,
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
app.get('/', (req, res) => res.send('Diabetes Backend API is running... v3'));
app.get('/health', (req, res) => res.json({ status: 'ok', db: global.dbConnected, env: process.env.NODE_ENV, version: 'v3' }));

// Test POST endpoint to verify POST requests work on Render
app.post('/test-post', (req, res) => {
    console.log('>>> TEST POST received:', req.body);
    res.json({ success: true, message: 'POST works!', body: req.body, version: 'v3' });
});

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

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const predictionRoutes = require('./routes/predictionRoutes');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/api', predictionRoutes);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diabetes_db_new';

global.dbConnected = false;

mongoose.connect(MONGO_URI)
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

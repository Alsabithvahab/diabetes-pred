const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Prediction = require('../models/Prediction');
const DATA_FILE = path.join(__dirname, '../data.json');

// Helper to handle local storage
const readLocal = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
};
const writeLocal = (data) => {
    const history = readLocal();
    history.push(data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
};

exports.getPrediction = async (req, res) => {
    try {
        const {
            name, location, age, glucose,
            bloodPressure, skinThickness, insulin, bmi,
            diabetesPedigreeFunction, genetics
        } = req.body;

        // 1. ROBUST INPUT VALIDATION & CASTING
        const numericFields = {
            glucose: parseFloat(glucose),
            bloodPressure: parseFloat(bloodPressure),
            insulin: parseFloat(insulin || 0),
            bmi: parseFloat(bmi || 25.0),
            age: parseFloat(age)
        };

        // Check for NaN in required fields
        const requiredFields = ['glucose', 'bloodPressure', 'age'];
        for (const field of requiredFields) {
            if (isNaN(numericFields[field])) {
                console.warn(`!!! Missing or invalid required field: ${field}`);
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_INPUT',
                    message: `Please provide a valid numeric value for ${field}.`
                });
            }
        }

        let mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
        
        // Normalize URL: ensure protocol and remove trailing slash
        if (!mlServiceUrl.startsWith('http')) {
            mlServiceUrl = `http://${mlServiceUrl}`;
        }
        mlServiceUrl = mlServiceUrl.replace(/\/+$/, '');

        const targetUrl = `${mlServiceUrl}/predict`;
        console.log(`>>> [BACKEND] Calling ML Service: ${targetUrl}`);

        const mlResponse = await axios.post(targetUrl, {
            ...numericFields,
            skinThickness: 0,
            diabetesPedigreeFunction: 0.47,
            genetics
        }, { 
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Diabetes-Backend/1.0'
            }
        });

        console.log(">>> [ML SERVICE] Response SUCCESS.");
        const { probability, risk_level, shap_values, lime_explanation, counterfactual, recommendations } = mlResponse.data;

        const result = {
            name, 
            age: numericFields.age, 
            glucose: numericFields.glucose, 
            bloodPressure: numericFields.bloodPressure, 
            insulin: numericFields.insulin, 
            bmi: numericFields.bmi, 
            genetics, 
            location,
            probability, 
            riskLevel: risk_level, 
            shapSummary: shap_values,
            userId: req.user ? (req.user.id || req.user._id) : null,
            date: new Date()
        };

        console.log(`>>> PREDICTION READY TO SAVE. UserID: ${result.userId || 'GUEST'}. DB Connected: ${global.dbConnected}`);

        if (global.dbConnected) {
            console.log(">>> Attempting MongoDB Save...");
            const newPrediction = new Prediction(result);
            const saved = await newPrediction.save();
            result._id = saved._id;
            console.log(">>> MongoDB Save SUCCESS:", result._id);
        } else {
            result._id = Date.now().toString();
            console.log(">>> DB NOT CONNECTED. Falling back to Local JSON Save.");
            writeLocal(result);
        }

        console.log(">>> Returning success to frontend.");
        res.status(200).json({
            success: true,
            data: {
                probability,
                risk_level,
                shap_values,
                lime_explanation,
                counterfactual,
                recommendations,
                id: result._id
            }
        });
    } catch (error) {
        console.error("!!! PREDICTION CONTROLLER ERROR !!!");
        console.error("Error Message:", error.message);

        if (error.response) {
            console.error("Target URL that failed:", error.config.url);
            console.error("ML Service Status Code:", error.response.status);
            console.error("ML Service Error Body:", error.response.data);

            let userMessage = error.response.data.message || error.message;
            if (error.response.status === 403) {
                userMessage = "ML Service Error: Forbidden. The AI engine rejected the request.";
            }

            return res.status(error.response.status).json({
                success: false,
                error: 'ML_SERVICE_FAILURE',
                source: 'ML_SERVICE', // Tag the source
                statusCode: error.response.status,
                message: userMessage,
                debug: {
                    targetUrl: error.config.url,
                    responseData: error.response.data
                }
            });
        }

        res.status(500).json({
            success: false,
            error: 'BACKEND_CRASH',
            source: 'BACKEND',
            message: error.message
        });
    }
};

exports.getHistory = async (req, res) => {
    try {
        let history;
        console.log(`>>> FETCHING HISTORY for UserID: ${req.user ? (req.user.id || req.user._id) : 'NONE'}. DB Connected: ${global.dbConnected}`);

        if (global.dbConnected) {
            history = await Prediction.find({ userId: req.user.id || req.user._id }).sort({ date: -1 });
            console.log(`>>> MongoDB History Found: ${history.length} items.`);
        } else {
            const userId = req.user.id || req.user._id;
            history = readLocal()
                .filter(h => h.userId === userId)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log(`>>> Local JSON History Found: ${history.length} items for UserID: ${userId}.`);
        }
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        let analytics;
        if (global.dbConnected) {
            analytics = await Prediction.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
                { $group: { _id: "$location", count: { $sum: 1 } } }
            ]);
        } else {
            const history = readLocal().filter(h => h.userId === req.user.id);
            const counts = {};
            history.forEach(h => { counts[h.location] = (counts[h.location] || 0) + 1; });
            analytics = Object.keys(counts).map(loc => ({ _id: loc, count: counts[loc] }));
        }
        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        console.error("Analytics Error DETAILS:", error);
        res.status(500).json({ success: false, message: "Analytics error: " + error.message });
    }
};

exports.getAllPredictions = async (req, res) => {
    try {
        let history;
        if (global.dbConnected) {
            history = await Prediction.find().populate('userId', 'fullName email').sort({ date: -1 });
        } else {
            history = readLocal().sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("All Predictions Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePrediction = async (req, res) => {
    try {
        console.log("--- DELETE REQUEST START ---");
        console.log("ID Parameter:", req.params.id);

        if (global.dbConnected) {
            console.log("Database: MongoDB Mode");
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                console.warn("!!! Invalid ID format:", req.params.id);
                return res.status(400).json({ success: false, message: 'Invalid ID format' });
            }

            console.log("Executing Prediction.findByIdAndDelete...");
            const deleted = await Prediction.findByIdAndDelete(req.params.id);
            console.log("Result of deletion:", deleted ? "Found and Deleted" : "Not Found in DB");

            return res.status(200).json({ success: true, message: 'Prediction deleted successfully' });
        } else {
            console.log("Database: Local JSON Mode");
            const history = readLocal();
            const originalLength = history.length;
            const updatedHistory = history.filter(p => p._id !== req.params.id);

            if (updatedHistory.length === originalLength) {
                console.warn("!!! Record not found in JSON file");
                return res.status(404).json({ success: false, message: 'Record not found' });
            }

            fs.writeFileSync(DATA_FILE, JSON.stringify(updatedHistory, null, 2));
            console.log("Successfully updated JSON file");
            return res.status(200).json({ success: true, message: 'Prediction deleted successfully' });
        }
    } catch (error) {
        console.error("!!! CRITICAL DELETE ERROR:", error);
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        console.log("--- DELETE REQUEST END ---");
    }
};

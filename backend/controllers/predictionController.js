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
        console.log("Received prediction request:", req.body);
        let {
            name, location, age, pregnancies, glucose,
            bloodPressure, skinThickness, insulin, bmi,
            diabetesPedigreeFunction, genetics
        } = req.body;

        // Apply defaults if missing (for cases where they are removed from UI)
        if (skinThickness === undefined) skinThickness = 0;
        if (bmi === undefined) bmi = 25.0;
        if (diabetesPedigreeFunction === undefined) diabetesPedigreeFunction = 0.47;

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
        console.log(`Calling ML service at ${mlServiceUrl}/predict`);
        const mlResponse = await axios.post(`${mlServiceUrl}/predict`, {
            pregnancies, glucose, bloodPressure, skinThickness,
            insulin, bmi, diabetesPedigreeFunction, age, genetics
        });

        console.log("ML service response received");
        const { probability, risk_level, shap_values, lime_explanation, counterfactual, recommendations } = mlResponse.data;

        const result = {
            name, age, glucose, bloodPressure, bmi, genetics, location,
            probability, riskLevel: risk_level, shapSummary: shap_values,
            userId: req.user.id,
            date: new Date()
        };

        if (global.dbConnected) {
            console.log("Saving to MongoDB");
            const newPrediction = new Prediction(result);
            const saved = await newPrediction.save();
            result._id = saved._id;
            console.log("Saved to MongoDB:", result._id);
        } else {
            result._id = Date.now().toString();
            console.log("Saving to local JSON");
            writeLocal(result);
            console.log("Saved to local JSON");
        }

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
        console.error("Prediction Error:", error);
        if (error.response) {
            console.error("ML Service Error Response:", error.response.data);
            return res.status(error.response.status).json({ success: false, message: error.response.data.message || error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        let history;
        if (global.dbConnected) {
            history = await Prediction.find({ userId: req.user.id }).sort({ date: -1 });
        } else {
            history = readLocal()
                .filter(h => h.userId === req.user.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
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
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

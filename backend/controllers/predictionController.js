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
        const {
            name, location, age, pregnancies, glucose,
            bloodPressure, skinThickness, insulin, bmi,
            diabetesPedigreeFunction, genetics
        } = req.body;

        console.log("Calling ML service at http://localhost:5000/predict");
        const mlResponse = await axios.post('http://localhost:5000/predict', {
            pregnancies, glucose, bloodPressure, skinThickness,
            insulin, bmi, diabetesPedigreeFunction, age, genetics
        });

        console.log("ML service response received");
        const { probability, risk_level, shap_values, lime_explanation, counterfactual, recommendations } = mlResponse.data;

        const result = {
            name, age, glucose, bloodPressure, bmi, genetics, location,
            probability, riskLevel: risk_level, shapSummary: shap_values,
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
        console.error("Prediction Error:", error.message);
        if (error.response) {
            console.error("ML Service Error Response:", error.response.data);
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        let history;
        if (global.dbConnected) {
            history = await Prediction.find().sort({ date: -1 });
        } else {
            history = readLocal().sort((a, b) => new Date(b.date) - new Date(a.date));
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
                { $group: { _id: "$location", count: { $sum: 1 } } }
            ]);
        } else {
            const history = readLocal();
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

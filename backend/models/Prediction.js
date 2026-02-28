const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    glucose: { type: Number, required: true },
    bloodPressure: { type: Number, required: true },
    bmi: { type: Number, required: false },
    genetics: { type: String, required: true },
    location: { type: String, required: true },
    probability: { type: Number, required: true },
    riskLevel: { type: String, required: true },
    shapSummary: [
        {
            feature: String,
            value: Number,
            effect: String
        }
    ],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', PredictionSchema);

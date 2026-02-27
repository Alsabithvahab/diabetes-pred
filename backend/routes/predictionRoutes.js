const express = require('express');
const router = express.Router();
const { getPrediction, getHistory, getAnalytics } = require('../controllers/predictionController');

router.post('/predict', getPrediction);
router.get('/history', getHistory);
router.get('/analytics', getAnalytics);

module.exports = router;

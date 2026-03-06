const express = require('express');
const router = express.Router();
const { getPrediction, getHistory, getAnalytics, getAllPredictions, deletePrediction } = require('../controllers/predictionController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/predict', getPrediction);
router.get('/history', auth, getHistory);
router.get('/analytics', auth, getAnalytics);
router.get('/all', auth, admin, getAllPredictions);
router.delete('/all/:id', auth, admin, deletePrediction);

module.exports = router;

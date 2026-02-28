const express = require('express');
const router = express.Router();
const { getPrediction, getHistory, getAnalytics } = require('../controllers/predictionController');
const auth = require('../middleware/authMiddleware');

router.post('/predict', auth, getPrediction);
router.get('/history', auth, getHistory);
router.get('/analytics', auth, getAnalytics);

module.exports = router;

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function verifyFullFlow() {
    try {
        console.log('--- 1. Registering Test User ---');
        const user = {
            fullName: "Verification User",
            email: `verify_${Date.now()}@example.com`,
            password: 'password123'
        };
        const regRes = await axios.post(`${API_URL}/auth/register`, user);
        const token = regRes.data.token;
        console.log('Auth Success, Token obtained.');

        console.log('\n--- 2. Sending Prediction Request via Backend ---');
        const predictionData = {
            name: "End-to-End Test",
            location: "Verification Lab",
            age: 50,
            glucose: 150,
            bloodPressure: 85,
            skinThickness: 25,
            insulin: 90,
            bmi: 28.0,
            diabetesPedigreeFunction: 0.6,
            genetics: "Yes"
        };

        const predictRes = await axios.post(`${API_URL}/predictions/predict`, predictionData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Prediction Success!');
        console.log('Result:', JSON.stringify(predictRes.data.data, null, 2));

        console.log('\n--- 3. Verifying Prediction was saved to history ---');
        const historyRes = await axios.get(`${API_URL}/predictions/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const saved = historyRes.data.data.find(p => p.name === "End-to-End Test");
        if (saved) {
            console.log('Verified: Prediction found in history.');
        } else {
            console.log('Warning: Prediction NOT found in history.');
        }

    } catch (error) {
        console.error('Flow verification failed:', error.response?.data || error.message);
    }
}

verifyFullFlow();

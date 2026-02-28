const axios = require('axios');

const AUTH_URL = 'http://localhost:5001/api/auth/login';
const PREDICT_URL = 'http://localhost:5001/api/predict';

const credentials = {
    email: 'test_user@example.com', // Using a generic one, I'll need to create or use existing
    password: 'password123'
};

async function verify() {
    try {
        console.log('--- Step 1: Login ---');
        let token;
        try {
            const loginRes = await axios.post(AUTH_URL, credentials);
            token = loginRes.data.token;
            console.log('Login successful');
        } catch (err) {
            console.log('Login failed, trying to register first...');
            const regRes = await axios.post('http://localhost:5001/api/auth/register', credentials);
            token = regRes.data.token;
            console.log('Registration and Login successful');
        }

        console.log('\n--- Step 2: Submit Prediction WITHOUT SkinThickness, BMI, Pedigree ---');
        const predictionData = {
            name: 'Verification User',
            location: 'New York',
            age: 35,
            pregnancies: 2,
            glucose: 120,
            bloodPressure: 80,
            insulin: 90,
            genetics: 'No'
        };

        const res = await axios.post(PREDICT_URL, predictionData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Prediction Success:', res.data.success);
        console.log('Risk Level:', res.data.data.risk_level);
        console.log('Probability:', res.data.data.probability);

        console.log('\n--- Verification COMPLETE ---');

    } catch (error) {
        console.error('Verification FAILED:', error.response?.data || error.message);
    }
}

verify();

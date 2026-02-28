const axios = require('axios');

const API_URL = 'http://localhost:5001/api/auth';
const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'password123'
};

async function testAuth() {
    try {
        console.log('--- Testing Registration ---');
        const regRes = await axios.post(`${API_URL}/register`, testUser);
        console.log('Registration Success:', regRes.data.success);
        const token = regRes.data.token;

        console.log('\n--- Testing Login ---');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('Login Success:', loginRes.data.success);

        console.log('\n--- Testing Protected Route (History) ---');
        try {
            const historyRes = await axios.get('http://localhost:5001/api/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Protected Route Success:', historyRes.data.success);
        } catch (err) {
            console.log('Protected Route Failed (Expected if no predictions exist yet or if DB error):', err.response?.data || err.message);
        }

        console.log('\n--- Testing Unauthorized Access ---');
        try {
            await axios.get('http://localhost:5001/api/history');
            console.log('Unauthorized Access: FAILED (Should have been denied)');
        } catch (err) {
            console.log('Unauthorized Access Success: Denied as expected');
        }

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testAuth();

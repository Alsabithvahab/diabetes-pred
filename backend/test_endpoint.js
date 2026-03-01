const axios = require('axios');

const testBackend = async () => {
    try {
        console.log('Testing Backend at http://localhost:5001/api/predictions/predict...');
        const response = await axios.post('http://localhost:5001/api/predictions/predict', {
            name: "Internal Test",
            location: "Test Area",
            age: 45,
            glucose: 140,
            bloodPressure: 80,
            skinThickness: 20,
            insulin: 80,
            bmi: 26.5,
            diabetesPedigreeFunction: 0.5,
            genetics: "Yes"
        });
        console.log('Backend Success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Backend Error:', error.response ? error.response.data : error.message);
    }
};

testBackend();

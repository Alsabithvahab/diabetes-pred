const axios = require('axios');

const testPrediction = async () => {
    try {
        const response = await axios.post('http://localhost:5000/predict', {
            pregnancies: 1,
            glucose: 110,
            bloodPressure: 70,
            skinThickness: 15,
            insulin: 70,
            bmi: 22,
            diabetesPedigreeFunction: 0.4,
            age: 28,
            genetics: 'No'
        });
        console.log('Success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

testPrediction();

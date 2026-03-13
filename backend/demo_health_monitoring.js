const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function demoHealthMonitoring() {
    try {
        console.log('\n🚀 --- STARTING HEALTH MONITORING DEMO ---\n');

        // 1. Register a fresh test user
        const timestamp = Date.now();
        const user = {
            fullName: "Demo User",
            email: `demo_${timestamp}@health.com`,
            password: 'password123'
        };
        
        console.log(`Step 1: Registering User: ${user.email}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, user);
        const token = regRes.data.token;
        console.log('✅ Registration Success.\n');

        // 2. Journey: Month 1 - High Risk Baseline
        console.log('Step 2: Submitting Baseline Assessment (High Risk)...');
        const assessment1 = {
            name: "Month 1 Baseline",
            location: "Main Clinic",
            age: 45,
            glucose: 180, // High
            bloodPressure: 95,
            insulin: 150, // High
            bmi: 34.2,    // Obese
            genetics: "Yes"
        };
        const res1 = await axios.post(`${API_URL}/predictions/predict`, assessment1, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Result: Risk Level: ${res1.data.data.risk_level} (${(res1.data.data.probability * 100).toFixed(1)}%)\n`);

        // Wait a bit to ensure dates are slightly different (though it's fast)
        await new Promise(r => setTimeout(r, 1000));

        // 3. Journey: Month 2 - Showing Improvement
        console.log('Step 3: Submitting Follow-up (Improving Trends)...');
        const assessment2 = {
            name: "Month 2 Progress",
            location: "Main Clinic",
            age: 45,
            glucose: 130, // Improved
            bloodPressure: 85,
            insulin: 90,  // Normalizing
            bmi: 31.5,    // Improving
            genetics: "Yes"
        };
        const res2 = await axios.post(`${API_URL}/predictions/predict`, assessment2, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Result: Risk Level: ${res2.data.data.risk_level} (${(res2.data.data.probability * 100).toFixed(1)}%)\n`);

        await new Promise(r => setTimeout(r, 1000));

        // 4. Journey: Month 3 - Goal Achieved
        console.log('Step 4: Submitting Current Status (Optimal/Low Risk)...');
        const assessment3 = {
            name: "Month 3 Current",
            location: "Main Clinic",
            age: 45,
            glucose: 95,  // Normal
            bloodPressure: 80,
            insulin: 60,  // Normal
            bmi: 24.5,    // Normal
            genetics: "Yes"
        };
        const res3 = await axios.post(`${API_URL}/predictions/predict`, assessment3, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   Result: Risk Level: ${res3.data.data.risk_level} (${(res3.data.data.probability * 100).toFixed(1)}%)\n`);

        // 5. Final Analytics/Trends
        console.log('Step 5: Fetching Monitoring Dashboard Data...');
        const historyRes = await axios.get(`${API_URL}/predictions/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const history = historyRes.data.data;
        const latest = history[0];
        const first = history[history.length - 1];
        
        const lifeTimeShift = ((latest.probability - first.probability) * 100).toFixed(1);
        
        console.log('\n📊 --- HEALTH MONITORING REPORT ---');
        console.log(`Assessments Tracked: ${history.length}`);
        console.log(`Initial Risk: ${(first.probability * 100).toFixed(1)}%`);
        console.log(`Current Risk: ${(latest.probability * 100).toFixed(1)}%`);
        console.log(`Lifetime Improvement: ${Math.abs(lifeTimeShift)}% reduction in risk.`);
        
        if (parseFloat(lifeTimeShift) < -10) {
            console.log('🏆 TREND ANALYSIS: Remarkable improvement detected!');
        } else if (parseFloat(lifeTimeShift) < 0) {
            console.log('📈 TREND ANALYSIS: Positive health trajectory confirmed.');
        } else {
            console.log('⚠️ TREND ANALYSIS: Stable or increasing risk factors.');
        }1
        console.log('------------------------------------\n');

        console.log('✅ Demo Completed Successfully.\n');

    } catch (error) {
        console.error('\n❌ Demo Failed:', error.response?.data || error.message);
    }
}

demoHealthMonitoring();

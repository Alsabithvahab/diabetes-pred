const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Prediction = require('./models/Prediction');

dotenv.config();

const analyze = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const predictions = await Prediction.find({});
        console.log("Total predictions found in DB:", predictions.length);
        const stats = {};

        predictions.forEach(p => {
            const loc = p.location || 'Unknown';
            if (!stats[loc]) stats[loc] = { total: 0, high: 0, medium: 0, low: 0 };
            stats[loc].total++;
            const risk = (p.riskLevel || 'Low').toLowerCase();
            if (risk === 'high') stats[loc].high++;
            else if (risk === 'medium') stats[loc].medium++;
            else stats[loc].low++;
        });

        console.log("LOCATION_STATS_START");
        console.log(JSON.stringify(stats, null, 2));
        console.log("LOCATION_STATS_END");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

analyze();

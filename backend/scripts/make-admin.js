const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diabetes_db_new';
const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address: node make-admin.js user@example.com');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(async () => {
        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { isAdmin: true },
            { new: true }
        );

        if (user) {
            console.log(`Success! ${user.email} is now an administrator.`);
        } else {
            console.error(`User with email ${email} not found.`);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });

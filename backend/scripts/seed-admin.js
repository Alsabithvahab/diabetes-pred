const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdminFromEnv = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('Error: ADMIN_EMAIL or ADMIN_PASSWORD not found in .env');
            process.exit(1);
        }

        console.log(`Target Admin: ${adminEmail}`);

        let user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log('User already exists. Updating to admin...');
            user.isAdmin = true;
            user.password = adminPassword; // Pre-save hook will hash it
            await user.save();
            console.log('Admin account updated correctly.');
        } else {
            console.log('Creating new admin user...');
            user = new User({
                fullName: 'System Administrator',
                email: adminEmail,
                password: adminPassword,
                isAdmin: true
            });
            await user.save();
            console.log('Admin user created successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err.message);
        process.exit(1);
    }
};

seedAdminFromEnv();

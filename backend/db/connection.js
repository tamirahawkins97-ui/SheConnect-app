const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set. Add it to backend/.env before connecting to MongoDB.');
    }

    const { connection } = await mongoose.connect(process.env.MONGO_URI, {
        dbName: 'SheConnect',
    });
    console.log(`MongoDB successfully connected! Database: ${connection.name}`);
    return connection;
};

module.exports = connectDB;
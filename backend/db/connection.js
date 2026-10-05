//DEPENDANCIES 
const mongoose = require('mongoose');

const connectDB = async () =>{
    mongoose.connect(process.env.MONGO_URI, {
        dbName: 'SheConnect',
    });
    const db = mongoose.connection;

    db.on('error', (error) => console.log(error.message + 'MongoDB is not running.'));
    db.on('Connected', () => console.log(`Mongodb successfully connected! Database:${db.name}`));
    db.on('disconnected', () => console.log('Mongodb has not been connected.'));
};

module.exports = connectDB;
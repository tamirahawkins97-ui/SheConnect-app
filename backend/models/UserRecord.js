//DEPENDANCIES 
const mongoose = require('mongoose');

const userRecordSchema = new mongoose.Schema({

});

const userRecord = mongoose.model('userRecord', userRecordSchema);

module.exports = userRecord;
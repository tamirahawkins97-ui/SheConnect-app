//DEPENDANCIES 
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const userSchema = new mongoose.Schema({

});

const User = mongoose.model('User', userSchema);

module.exports = User; 
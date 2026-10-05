//DEPENDANCIES 
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const userSchema = new mongoose.Schema({
    username:{type: String, required:[true, 'Username is required.'], unique: true, trim: true},
    email:{type:String, required:[true, 'Email is required.'], match: [/.+@.+\..+/, "Please provide a valid email addres."]},
    password: {type:String, required:[true, 'Password is required.'], minlength: [7, 'Password must be at least 7 characters long.'], trim: true, unique: true},
    role: {type: String,  enum: ['user', 'admin'], default: 'user'}
});

const User = mongoose.model('User', userSchema);

module.exports = User; 
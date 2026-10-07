//DEPENDANCIES 
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const userSchema = new mongoose.Schema({
    username:{
        type: String, 
        required:[true, 'Username is required.'], 
        unique: true,
        trim: true
    },
    email:{
        type:String, 
        required:[true, 'Email is required.'],
        match: [/.+@.+\..+/, "Please provide a valid email addres."],
        lowercase: true,
        trim: true
    },
    password:{
        type:String, 
        required:[true, 'Password is required.'],
        minlength: [7, 'Password must be at least 7 characters long.'], 
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'Veteran Mommy'], 
          default: 'user'
    },
    avatar: {
        type: String,
        trim: true
    },
    pregnancyMonth: {
        type: Number,
        min: [1, 'Pregnancy month must be between 1 and 9.'],
        max: [9, 'Pregnancy month must be between 1 and 9.'],
    },
    momStatus: {
        type: String,
        enum: ['1st Trimester', '2nd Trimester', '3rd Trimester', 'Newborn Season', 'Toddler Pro'],
        default: '2nd Trimester',
    },
    showActiveStatus: {
        type: Boolean,
        default: true,
    },
    allowDirectMessages: {
        type: Boolean,
        default: true,
    },
    lastSeenAt: {
        type: Date,
        default: null
    },
});

userSchema.pre('save', async function() {
    if(this.isNew || this.isModified('password')){
       this.password = await bcrypt.hash(this.password, saltRounds)
    }
}); 

userSchema.methods.isCorrectPassword = function(password) {
    return bcrypt.compare(password, this.password);
}

const User = mongoose.model('User', userSchema);

module.exports = User; 
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
        match: [/.+@.+\..+/, "Please provide a valid email addres."]
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
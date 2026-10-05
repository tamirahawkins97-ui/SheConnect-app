//DEPENDANCIES 
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    imageURL:{
        type: String, 
    },
    message: {
        type: String, 
        required:[true, 'Please fill out this field.'], 
        trim: true
    },
    Day: {
        type:Number,
         required: [true, 'Please tell us how many days along you are :).']
    },
    Week: {
        type: Number,
         required:[true, 'Please tell us how many weeks along you are :).']
    },
    Trimester:{
        type:String,
         required:[true, 'Trimester is required girly pop!:)']
    },
    dueDate:{
        type:String,
         required: [true, 'Due date is required girly pop! :)']
    }
}, {
    timestamps: true
});

const Post = mongoose.model('Post', postSchema)

module.exports = Post;
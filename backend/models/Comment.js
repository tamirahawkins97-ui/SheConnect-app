//DEPENDANCIES 
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },

    postId: {
        type:mongoose.Schema.Types.ObjectId, ref: 'User', required:true,
    },

    content: {
        type: String, 
        trim: true
    }

}, {
    timestamps:true
});

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment;
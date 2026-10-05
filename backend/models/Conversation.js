//DEPENDANCIES 
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({

});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
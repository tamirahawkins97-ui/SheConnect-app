const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: [true, 'Chat type is required'],
      default: 'direct',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    maxParticipants: {
      type: Number,
      default: function () {
        // Defaults to 2 for direct chats, 50 (or any preferred limit) for groups
        return this.type === 'direct' ? 2 : 50;
      },
      min: [2, 'A conversation must have at least 2 participants'],
    },
    groupTitle: {
      type: String,
      trim: true,
      maxLength: [100, 'Group title cannot exceed 100 characters'],
      // Only required if type is 'group'
      validate: {
        validator: function (value) {
          if (this.type === 'group') {
            return typeof value === 'string' && value.trim().length > 0;
          }
          return true;
        },
        message: 'groupTitle is required for group conversations',
      },
    },
    lastMessage: {
      // Option A: Reference to a Message document
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true, 
  }
);

// Prevent direct chats from exceeding 2 participants or maxParticipants limits
conversationSchema.pre('validate', function (next) {
  if (this.type === 'direct' && this.participants.length > 2) {
    return next(new Error('Direct conversations cannot have more than 2 participants'));
  }
  if (this.maxParticipants && this.participants.length > this.maxParticipants) {
    return next(new Error(`Participant count exceeds the maximum limit of ${this.maxParticipants}`));
  }
  next();
});

// Essential indexes for fast chat inbox queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
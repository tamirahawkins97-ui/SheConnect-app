const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

const getAuthUserId = (req) => req.user?._id || req.user?.id;

function isValidId(value) {
  return mongoose.isValidObjectId(value);
}

function getLastMessage(conversation) {
  return conversation.messages?.[conversation.messages.length - 1] || null;
}

function getSenderId(message) {
  return message.sender?._id?.toString() || message.sender?.toString() || '';
}

async function getUserConversations(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const conversations = await Conversation.find({ participants: currentUserId })
      .populate('participants', 'username role')
      .populate('messages.sender', 'username')
      .sort({ updatedAt: -1 });

    const conversationList = conversations.map((conversation) => {
      const participant = conversation.participants.find(
        (user) => user._id.toString() !== currentUserId.toString()
      );
      const lastMessage = getLastMessage(conversation);
      const unreadCount = conversation.messages.filter(
        (message) =>
          getSenderId(message) !== currentUserId.toString() &&
          !message.read
      ).length;

      return {
        _id: conversation._id,
        type: conversation.type,
        groupTitle: conversation.groupTitle,
        participants: conversation.participants,
        participant: participant || null,
        lastMessage: lastMessage
          ? {
              _id: lastMessage._id,
              text: lastMessage.text,
              sender: getSenderId(lastMessage),
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        updatedAt: conversation.updatedAt,
      };
    });

    return res.status(200).json(conversationList);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ message: 'Unable to fetch conversations.' });
  }
}

async function getConversationMessages(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { id } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid conversation id.' });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    })
      .populate('participants', 'username role')
      .populate('messages.sender', 'username');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const hasUnreadIncoming = conversation.messages.some(
      (message) =>
        getSenderId(message) !== currentUserId.toString() &&
        !message.read
    );

    if (hasUnreadIncoming) {
      conversation.messages.forEach((message) => {
        if (getSenderId(message) !== currentUserId.toString()) {
          message.read = true;
        }
      });
      await conversation.save();
    }

    return res.status(200).json({
      _id: conversation._id,
      type: conversation.type,
      groupTitle: conversation.groupTitle,
      participants: conversation.participants,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return res.status(500).json({ message: 'Unable to fetch messages.' });
  }
}

async function sendConversationMessage(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { id } = req.params;
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid conversation id.' });
    }
    if (!text) {
      return res.status(400).json({ message: 'Message text is required.' });
    }
    if (text.length > 5000) {
      return res.status(400).json({ message: 'Message text cannot exceed 5000 characters.' });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    conversation.messages.push({ sender: currentUserId, text });
    conversation.updatedAt = new Date();
    await conversation.save();
    await conversation.populate('messages.sender', 'username');

    const message = conversation.messages[conversation.messages.length - 1];
    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending conversation message:', error);
    return res.status(500).json({ message: 'Unable to send message.' });
  }
}

async function markConversationAsRead(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { id } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid conversation id.' });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    let modifiedCount = 0;
    conversation.messages.forEach((message) => {
      if (getSenderId(message) !== currentUserId.toString() && !message.read) {
        message.read = true;
        modifiedCount += 1;
      }
    });

    if (modifiedCount > 0) {
      await conversation.save();
    }

    return res.status(200).json({
      message: 'Incoming messages marked as read.',
      modifiedCount,
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return res.status(500).json({ message: 'Unable to mark messages as read.' });
  }
}

module.exports = {
  getUserConversations,
  getConversationMessages,
  sendConversationMessage,
  markConversationAsRead,
};

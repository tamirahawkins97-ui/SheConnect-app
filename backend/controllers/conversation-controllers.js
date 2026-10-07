const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

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

async function createConversation(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { type } = req.body || {};

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (type !== 'direct' && type !== 'group') {
      return res.status(400).json({ message: 'Conversation type must be direct or group.' });
    }

    let conversation;
    let statusCode = 201;

    if (type === 'direct') {
      const recipientId = req.body.recipientId;
      if (!isValidId(recipientId) || recipientId.toString() === currentUserId.toString()) {
        return res.status(400).json({ message: 'Choose a valid person to message.' });
      }

      const recipient = await User.findById(recipientId).select('_id');
      if (!recipient) {
        return res.status(404).json({ message: 'The selected person could not be found.' });
      }

      conversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [currentUserId, recipientId], $size: 2 },
      });

      if (conversation) {
        statusCode = 200;
      } else {
        conversation = await Conversation.create({
          type: 'direct',
          participants: [currentUserId, recipientId],
          maxParticipants: 2,
        });
      }
    } else {
      const participantIds = req.body.participantIds;
      const groupTitle = typeof req.body.groupTitle === 'string' ? req.body.groupTitle.trim() : '';
      const maxParticipants = req.body.maxParticipants === undefined
        ? 50
        : Number(req.body.maxParticipants);

      if (!Array.isArray(participantIds)) {
        return res.status(400).json({ message: 'Choose at least two people for a group conversation.' });
      }
      if (!groupTitle || groupTitle.length > 100) {
        return res.status(400).json({ message: 'Group title is required and must be at most 100 characters.' });
      }

      const uniqueParticipantIds = [...new Set(participantIds.map((id) => id?.toString()))]
        .filter((id) => id && id !== currentUserId.toString());

      if (uniqueParticipantIds.length < 2) {
        return res.status(400).json({ message: 'Choose at least two other people for a group conversation.' });
      }
      if (uniqueParticipantIds.some((id) => !isValidId(id))) {
        return res.status(400).json({ message: 'One or more selected people are invalid.' });
      }
      if (!Number.isInteger(maxParticipants) || maxParticipants < 3 || maxParticipants > 50) {
        return res.status(400).json({ message: 'Group conversations can have between 3 and 50 participants.' });
      }
      if (uniqueParticipantIds.length + 1 > maxParticipants) {
        return res.status(400).json({ message: 'The selected group is larger than its participant limit.' });
      }

      const matchingUsers = await User.countDocuments({ _id: { $in: uniqueParticipantIds } });
      if (matchingUsers !== uniqueParticipantIds.length) {
        return res.status(404).json({ message: 'One or more selected people could not be found.' });
      }

      conversation = await Conversation.create({
        type: 'group',
        participants: [currentUserId, ...uniqueParticipantIds],
        groupTitle,
        maxParticipants,
      });
    }

    await conversation.populate('participants', 'username role');
    const participants = conversation.participants;
    const participant = type === 'direct'
      ? participants.find((user) => user._id.toString() !== currentUserId.toString()) || null
      : null;

    return res.status(statusCode).json({
      _id: conversation._id,
      type: conversation.type,
      groupTitle: conversation.groupTitle,
      participants,
      participant,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ message: 'Unable to create conversation.' });
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

async function markConversationMessageAsRead(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { id, messageId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!isValidId(id) || !isValidId(messageId)) {
      return res.status(400).json({ message: 'Invalid conversation or message id.' });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found in this conversation.' });
    }
    if (getSenderId(message) === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot mark your own message as read.' });
    }

    if (!message.read) {
      message.read = true;
      await conversation.save();
    }

    return res.status(200).json({ message: 'Message marked as read.', messageId });
  } catch (error) {
    console.error('Error marking conversation message as read:', error);
    return res.status(500).json({ message: 'Unable to mark message as read.' });
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
  createConversation,
  getConversationMessages,
  sendConversationMessage,
  markConversationMessageAsRead,
  markConversationAsRead,
};

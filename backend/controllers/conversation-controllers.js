const Conversation = require('../models/conversation');

const getAuthUserId = (req) => req.user?.id || req.user?._id;

// 1. Returns active conversations with last message preview and unread count
async function getUserConversations(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find all conversations containing the authenticated user
    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate('participants', 'displayName profilePic username')
      .sort({ updatedAt: -1 });

    const conversationList = conversations.map((convo) => {
      // The other person in the chat
      const otherUser = convo.participants.find(
        (p) => p._id.toString() !== currentUserId.toString()
      );

      // Grab the last embedded message in the array
      const lastMsg = convo.messages?.length
        ? convo.messages[convo.messages.length - 1]
        : null;

      // Count unread messages sent by the other person to me
      const unreadCount = convo.messages.filter(
        (msg) => msg.sender.toString() !== currentUserId.toString() && !msg.read
      ).length;

      return {
        _id: convo._id,
        participant: otherUser || null,
        lastMessage: lastMsg
          ? {
              text: lastMsg.text,
              createdAt: lastMsg.createdAt,
              isSender: lastMsg.sender.toString() === currentUserId.toString(),
            }
          : null,
        unreadCount,
        updatedAt: convo.updatedAt,
      };
    });

    return res.status(200).json(conversationList);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 2. Fetches historical message logs between authenticated user and :userId
async function getConversationByUserId(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find thread where BOTH users are in the participants array
    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] },
    }).populate('participants', 'displayName profilePic username');

    if (!conversation) {
      // If no past chat exists, return empty array so UI can render blank thread
      return res.status(200).json({ messages: [], conversationId: null });
    }

    return res.status(200).json({
      _id: conversation._id,
      participants: conversation.participants,
      messages: conversation.messages, // chronological array of subdocuments
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// 3. Marks all incoming messages from :userId as read: true
async function markConversationAsRead(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { userId: senderId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Update messages in the embedded array where sender is :userId and read is false
    const result = await Conversation.updateOne(
      {
        participants: { $all: [currentUserId, senderId] },
      },
      {
        $set: {
          'messages.$[elem].read': true,
        },
      },
      {
        arrayFilters: [{ 'elem.sender': senderId, 'elem.read': false }],
      }
    );

    return res.status(200).json({
      message: 'Incoming messages marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking messages read:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  getUserConversations,
  getConversationByUserId,
  markConversationAsRead,
};
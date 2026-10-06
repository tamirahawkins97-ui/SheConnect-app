const Conversation = require('../models/conversation');

// Helper to safely extract user ID from auth middleware
const getAuthUserId = (req) => req.user?.id || req.user?._id;

async function getUserConversations(req, res) {
  try {
    const currentUserId = getAuthUserId(req);

    if (!currentUserId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // 1. Fetch conversations where the current user is a participant
    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      // Populate the other user's info for the conversation card header
      .populate('participants', 'displayName profilePic username')
      // Populate the last message for the preview snippet & timestamp
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt read',
      })
      // Sort most recently updated conversation to the top
      .sort({ updatedAt: -1 });

    // 2. Format the response with unread counts and clean message previews
    const formattedConversations = conversations.map((convo) => {
      // Find the *other* participant to show their profile on the list card
      const otherParticipant = convo.participants.find(
        (p) => p._id.toString() !== currentUserId.toString()
      );
      // Check if the last message was unread and sent by someone else
      const hasUnread =
        convo.lastMessage &&
        convo.lastMessage.sender?.toString() !== currentUserId.toString() &&
        !convo.lastMessage.read;

      return {
        _id: convo._id,
        participant: otherParticipant || null,
        lastMessage: convo.lastMessage
          ? {
              text: convo.lastMessage.text,
              createdAt: convo.lastMessage.createdAt,
              isSender: convo.lastMessage.sender?.toString() === currentUserId.toString(),
            }
          : null,
        // If your schema tracks an unread counter array or flag:
        unreadCount: convo.unreadCounts?.get(currentUserId.toString()) || (hasUnread ? 1 : 0),
        updatedAt: convo.updatedAt,
      };
    });

    return res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Unable to retrieve conversations:', error);
    return res.status(500).json({
      message: 'Server cannot fetch conversations at this time. Please try again later.',
      error: error.message,
    });
  }
}

module.exports = { getUserConversations };
const express = require('express');
const router = express.Router();

const {
  getUserConversations,
  createConversation,
  getConversationMessages,
  sendConversationMessage,
  markConversationMessageAsRead,
  markConversationAsRead,
} = require('../controllers/conversation-controllers');

const { verifyToken } = require('../middleware/auth-middleware');

router.use(verifyToken);

router.get('/', getUserConversations);
router.post('/', createConversation);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', sendConversationMessage);
router.patch('/:id/messages/:messageId/read', markConversationMessageAsRead);
router.patch('/:id/read', markConversationAsRead);

module.exports = router;

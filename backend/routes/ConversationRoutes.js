const express = require('express');
const router = express.Router();

const {
  getUserConversations,
  getConversationMessages,
  sendConversationMessage,
  markConversationAsRead,
} = require('../controllers/conversation-controllers');

const { verifyToken } = require('../middleware/auth-middleware');

router.use(verifyToken);

router.get('/', getUserConversations);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', sendConversationMessage);
router.patch('/:id/read', markConversationAsRead);

module.exports = router;

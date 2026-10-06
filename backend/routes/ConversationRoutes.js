const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');

const {
  getUserConversations,
  getConversationByUserId,
  markConversationAsRead
} = require('../controllers/conversation-controllers');

const { verifyToken } = require('../middleware/auth-middleware');

router.use(verifyToken);

router.get('/', requireAuth, getUserConversations);
router.get('/:id', requireAuth, getConversationByUserId);
router.patch('/:id', requireAuth, markConversationAsRead);

module.exports = router;

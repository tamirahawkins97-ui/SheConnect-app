const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth-middleware');

const {
  getUserConversations,
  getConversationByUserId,
  markConversationAsRead
} = require('../controllers/conversation-controllers');

const { verifyToken } = require('../middleware/auth-middleware');

router.use(verifyToken);

router.get('/',  getUserConversations);
router.get('/:id',  getConversationByUserId);
router.patch('/:id', markConversationAsRead);

module.exports = router;

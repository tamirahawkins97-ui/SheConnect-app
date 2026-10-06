const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');

const {
  createComment,
  getPostComments,
  deleteComment
} = require('../controllers/comment-controllers');

// 1. PUBLIC: Anyone can read comments on a post
router.get('/', getPostComments);

// 2. PROTECTED: Must be logged in to post or delete
router.post('/',  requireAuth, createComment);
router.delete('/:id', deleteComment);

module.exports = router; 
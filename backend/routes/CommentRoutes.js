const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth-middleware');

const {
  createComment,
  getPostComments,
  deleteComment
} = require('../controllers/comment-controllers');

// 1. PUBLIC: Anyone can read comments on a post
router.get('/', getPostComments);

 router.use(verifyToken);
// 2. PROTECTED: Must be logged in to post or delete
router.post('/', createComment);
router.delete('/:id', deleteComment);

module.exports = router; 
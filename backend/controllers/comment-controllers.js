const Comment = require('../models/Comment');

const getAuthUserId = (req) => req.user?.id || req.user?._id;

async function createComment(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { postId } = req.params;
    const { text, gifUrl } = req.body;

    const trimmedText = text ? text.trim() : '';
    const cleanGif = gifUrl ? gifUrl.trim() : '';

    // Guard: Prevent completely empty submissions
    if (!trimmedText && !cleanGif) {
      return res.status(400).json({
        message: 'A comment must contain either text or a GIF/image.',
      });
    }

    const comment = await Comment.create({
      post: postId,
      author: currentUserId,
      text: trimmedText,
      gifUrl: cleanGif,
    });

    await comment.populate('author', 'displayName profilePic username');

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Failed to create comment', error: error.message });
  }
}

async function getPostComments(req, res) {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .populate('author', 'displayName profilePic username')
      .sort({ createdAt: 1 });

    return res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ message: 'Failed to load comments', error: error.message });
  }
}

async function deleteComment(req, res) {
  try {
    const currentUserId = getAuthUserId(req);
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    await comment.deleteOne();

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
}

module.exports = {
  createComment,
  getPostComments,
  deleteComment,
};
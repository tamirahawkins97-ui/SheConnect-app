const mongoose = require('mongoose');
const Post = require('../models/Post');

const getAuthUserId = (req) => req.user?._id || req.user?.id;

async function getUserPosts(req, res) {
  try {
    const posts = await Post.find({})
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Unable to fetch posts:', error);
    return res.status(500).json({ message: 'Unable to fetch posts.' });
  }
}

async function getSinglePost(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id.' });
    }

    const post = await Post.findById(req.params.id).populate('userId', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ message: 'Unable to fetch post.' });
  }
}

async function updatePost(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id.' });
    }

    const allowedFields = ['message', 'imageURL', 'Day', 'Week', 'Trimester', 'dueDate'];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid post fields were provided.' });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'username');

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found or you do not own it.' });
    }

    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(400).json({ message: error.message || 'Unable to update post.' });
  }
}

async function deleteUserPost(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id.' });
    }

    const deletedPost = await Post.findOneAndDelete({ _id: req.params.id, userId });
    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found or you do not own it.' });
    }

    return res.status(200).json({ message: 'Post successfully deleted.' });
  } catch (error) {
    console.error('Unable to delete post:', error);
    return res.status(500).json({ message: 'Unable to delete post.' });
  }
}

async function createUserPost(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }

    const post = await Post.create({
      userId,
      imageURL: req.body.imageURL || '',
      message: req.body.message,
      Day: req.body.Day,
      Week: req.body.Week,
      Trimester: req.body.Trimester,
      dueDate: req.body.dueDate,
    });

    await post.populate('userId', 'username');
    return res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(400).json({ message: error.message || 'Unable to create post.' });
  }
}

module.exports = {
  createUserPost,
  deleteUserPost,
  updatePost,
  getSinglePost,
  getUserPosts,
};

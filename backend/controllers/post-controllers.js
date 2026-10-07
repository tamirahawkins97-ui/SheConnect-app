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

    const rawDay = req.body.day ?? req.body.Day;
    const weekdayNumbers = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };
    const normalizedDay = typeof rawDay === 'string' && weekdayNumbers[rawDay]
      ? weekdayNumbers[rawDay]
      : Number(rawDay);
    const rawWeek = req.body.week ?? req.body.Week;
    const weekMatch = typeof rawWeek === 'string' ? rawWeek.match(/^week\s*(\d+)$/i) : null;
    const normalizedWeek = weekMatch ? Number(weekMatch[1]) : Number(rawWeek);
    const imageURL = req.body.imageURL ?? req.body.image ?? '';
    const trimester = req.body.trimester ?? req.body.Trimester;

    if (!Number.isInteger(normalizedDay) || normalizedDay < 1 || normalizedDay > 7) {
      return res.status(400).json({ message: 'Choose a valid day of the week.' });
    }
    if (!Number.isInteger(normalizedWeek) || normalizedWeek < 1 || normalizedWeek > 42) {
      return res.status(400).json({ message: 'Week must be a number between 1 and 42.' });
    }
    if (typeof req.body.message !== 'string' || !req.body.message.trim()) {
      return res.status(400).json({ message: 'Please add a message to your post.' });
    }
    if (typeof trimester !== 'string' || !trimester.trim()) {
      return res.status(400).json({ message: 'Please select a trimester.' });
    }
    if (typeof req.body.dueDate !== 'string' || !req.body.dueDate.trim()) {
      return res.status(400).json({ message: 'Please enter your due date.' });
    }
    if (typeof imageURL !== 'string') {
      return res.status(400).json({ message: 'The selected image is invalid.' });
    }

    const post = await Post.create({
      userId,
      imageURL,
      message: req.body.message.trim(),
      Day: normalizedDay,
      Week: normalizedWeek,
      Trimester: trimester.trim(),
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

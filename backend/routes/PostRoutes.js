const express = require('express');
const router = express.Router();

const {
    createUserPost, 
    deleteUserPost,
    updatePost, 
    getSinglePost,
    getUserPosts
} = require('../controllers/post-controllers');

const { verifyToken } = require('../middleware/auth-middleware');

// Apply verifyToken to all routes in this file
router.use(verifyToken);

router.get('/', getUserPosts);
router.post('/', createUserPost);
router.get('/:id', getSinglePost);
router.delete('/:id', deleteUserPost);
router.put('/:id', updatePost);

module.exports = router;
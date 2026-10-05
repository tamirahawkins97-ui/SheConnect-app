//DEPENDANCIES 
const Post = require('../models/Post');

// Helper to safely extract user ID
const getAuthUserId = (req) => req.user?.id || req.user?._id;

async function getUserPosts(req, res) {

    try {
    const { id } = req.params.id; 
    // 1. Find all posts where user matches the user ID
    // 2. Sort by newest first (-1)
    const posts = await Post.Find({user: id}).sort({createdAt: -1})

    return res.status(200).json(posts);

    } catch (error) {
        console.error('Unable to fetch user posts:', error);
        return res.status(500).json({message:'Sever error fetching posts', error: error.message});
    }
};

async function getSinglePost(req,res) {
    try {
        const userId = getAuthUserId(req)
        if (!userId) {
            return res.status(401).json({ message: 'Unable to fetch User. Invalid user Id.'});
        }

        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({message: 'Post not found'});
        }

        // Ownership check
        if (note.user.toString() !== userId.toString()) {
            return res.status(403).json({message: 'User not authorized to access this post'})
        }

        return res.status(200).json(post)

    } catch (error) {
        console.error('Error fetching post:', error)
        return res.status(500).json({message: 'Server error fetching post', error: error.message });
    }
};

async function updatePost(req,res){
    try{
        const userId = getAuthUserId(req)
        if(!userId){
            return res.status(401).json({ message: 'Unable to fetch User. Invalid user Id.'})
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true }
        );
        
        return res.status(200).json(updatePost)
    } catch (error){
        console.error('Error updating post:', error)
        return res.status(500).json({message: 'Server error updating post', error: error.message})
    }
};

async function deleteUserPost(req,res) {
    try {
        const userId = getAuthUserId;

        if(!userId) {
            return res.status(401).json({message: 'Unable to delete post. Invalid User id'})
        }

        const deletedPost = await Post.findByIdAndDelete(req.params.id)

        if(!deletedPost) {
            return res.status(404).json({message: 'Post not found to delete.'});
        }

        res.status(200).json({message: 'Post successfully deleted!'});

    } catch (error) {
        console.error('Unable to delete post', error)
        return res.status(500).json({message: 'Server error deleting post', error: error.message})
    }
};

async function createUserPost(req, res){
    try {
        const { imageURL, message, day, week, trimester, dueDate } = req.body;
        const userId = getAuthUserId(req) 
        if(!userId) {
            return res.status(401).json({message: 'Incorrect User id. Please try again.'})
        }

        const post = await Post.create({
            message,
            imageURL, 
            day,
            week, 
            trimester,
            dueDate,
            user: userId 
        });

        return res.status(201).json(post);

    } catch (error) {
        console.error('Error creating post :(', error)
        return res.status(500).json({ message: 'Server error creating note', error: error.message });
    }
};

module.exports = {
createUserPost, 
deleteUserPost,
updatePost, 
getSinglePost,
getUserPosts
}

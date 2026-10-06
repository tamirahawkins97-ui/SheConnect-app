//DEPENDANCIES 
const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const connectDB = require('./db/connection');
const PORT = process.env.PORT;

//DATABASE CONNECTION
connectDB();
//MIDDLEWARE
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

//Route Imports
const UserRoutes = require('./routes/UserRoutes');
const PostRoutes = require('./routes/PostRoutes');
const ConversationRoutes = require('./routes/ConversationRoutes');
const CommentRoutes = require('./routes/CommentRoutes');

//MOUNT ROUTES 

app.use('/api/posts/:postId/comments', CommentRoutes);
app.use('/api/comments',  CommentRoutes)
app.use('/api/conversations', ConversationRoutes);
app.use('/api/user', UserRoutes)
app.use('/api/posts', PostRoutes);

//PORT 
app.listen(PORT, () =>{
    console.log(`Server is now running on port: http://localhost:${PORT}`);
})
//DEPENDANCIES 
const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const connectDB = require('./db/connection');
const PORT = process.env.PORT || 1111;
const cors = require('cors');

//DATABASE CONNECTION
connectDB();

//CORS middleware Configuration
app.use(
    cors({
        origin: 'http://localhost:5173', //Vite dev server URL
        credentials: true,  //Allows auth headers, cookies, and tokens.
        methods: ['GET', 'POST', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'] //Now granted access to auth headers.
    })
);

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
app.use('/api/users', UserRoutes)
app.use('/api/posts', PostRoutes);

//PORT 
app.listen(PORT, () =>{
    console.log(`Server is now running on port: http://localhost:${PORT}`);
})
//DEPENDANCIES 
const express = require('express');
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const connectDB = require('./db/connection');
const PORT = process.env.PORT || 1111;
const cors = require('cors');
const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);

//CORS middleware Configuration
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Origin is not allowed by CORS.'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);

//MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
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
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is now running on port: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start the server because MongoDB connection failed:', error);
        process.exitCode = 1;
    }
}

startServer();
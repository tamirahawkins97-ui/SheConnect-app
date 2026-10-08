//DEPENDENCIES
const express = require('express');
const app = express();
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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
const frontendBuildDirectory = path.resolve(
  __dirname,
  '..',
  'frontend',
  'SheConnect-Frontend',
  'dist'
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true }));

const UserRoutes = require('./routes/UserRoutes');
const PostRoutes = require('./routes/PostRoutes');
const ConversationRoutes = require('./routes/ConversationRoutes');
const CommentRoutes = require('./routes/CommentRoutes');

app.use('/api/posts/:postId/comments', CommentRoutes);
app.use('/api/comments', CommentRoutes);
app.use('/api/conversations', ConversationRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/posts', PostRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use(express.static(frontendBuildDirectory));
app.get(/.*/, (req, res, next) => {
  res.sendFile(path.join(frontendBuildDirectory, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Request failed:', error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : 'An unexpected server error occurred.',
  });
});

async function startServer() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not set. Configure it in the deployment environment.');
        }
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is listening on port ${PORT}.`);
        });
    } catch (error) {
        console.error('Unable to start SheConnect:', error);
        process.exitCode = 1;
    }
}

startServer();
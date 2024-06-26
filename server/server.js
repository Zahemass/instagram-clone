const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
// Enable CORS
app.use(cors());

// Use body-parser to parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Initialize Multer with the storage configuration
const upload = multer({ storage });

// Serve the uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Store the posts in an array
const posts = [];

// Handle post creation
app.post('/api/posts', upload.single('image'), (req, res) => {
  const { description } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;
  const postId = Date.now().toString();

  // Add the new post to the posts array
  posts.push({ id: postId, description, imageUrl, likes: 0, comments: [] });

  // Emit a 'new post' event to all connected clients
  io.emit('new post', { id: postId, description, imageUrl, likes: 0, comments: [] });

  console.log('New post created successfully:', { id: postId, description, imageUrl });

  res.status(201).json({ id: postId, description, imageUrl });
});

// Handle likes
app.post('/api/posts/:id/like', (req, res) => {
    const postId = req.params.id;
  
    // Find the post in the posts array and increment the likes count
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].likes++;
      // Emit a 'like' event to all connected clients
      io.emit('like', { postId, likes: posts[postIndex].likes });
      console.log(`Post ${postId} liked. New likes count: ${posts[postIndex].likes}`);
      res.status(200).json({ likes: posts[postIndex].likes });
    } else {
      console.log(`Post ${postId} not found.`);
      console.log('posts array:', posts);
      res.status(404).json({ message: 'Post not found' });
    }
  });

// Handle comments
app.post('/api/posts/:id/comment', (req, res) => {
    const postId = req.params.id;
    const { comment } = req.body;
  
    // Find the post in the posts array and add the comment
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].comments.push(comment);
      // Emit a 'comment' event to all connected clients
      io.emit('comment', { postId, comment });
      console.log(`New comment added to post ${postId}: ${comment}`);
      res.status(201).json({ message: 'Comment added' });
    } else {
      console.log(`Post ${postId} not found.`);
      console.log('posts array:', posts);
      res.status(404).json({ message: 'Post not found' });
    }
  });

// Start the server
server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Box, Card, CardContent, CardMedia, Typography, IconButton, TextField, Button } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const socket = io('http://localhost:3001');
const SERVER_URL = 'http://localhost:3001';

const InstagramClone = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ description: '', image: null });
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Listen for 'new post' event from the server
    socket.on('new post', (post) => {
      console.log('New post received:', post);
      setPosts((prevPosts) => [...prevPosts, post]);
    });

    // Listen for 'like' event from the server
    socket.on('like', ({ postId, likes }) => {
      console.log(`Post ${postId} liked. New likes count: ${likes}`);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes } : post
        )
      );
    });

    // Listen for 'comment' event from the server
    socket.on('comment', ({ postId, comment }) => {
      console.log(`New comment added to post ${postId}: ${comment}`);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handlePostSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('image', newPost.image);
      formData.append('description', newPost.description);

      const response = await axios.post(`${SERVER_URL}/api/posts`, formData);
      const { id, description, imageUrl } = response.data;

      console.log('New post created:', { id, description, imageUrl });
      setPosts((prevPosts) => [
        ...prevPosts,
        { id, description, imageUrl, likes: 0, comments: [] },
      ]);

      setNewPost({ description: '', image: null });
    } catch (error) {
      console.error('Error uploading post:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      console.log(`Liking post ${postId}`);
      const response = await axios.post(`${SERVER_URL}/api/posts/${postId}/like`);
      console.log(`Post ${postId} liked. New likes count: ${response.data.likes}`);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: response.data.likes } : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    try {
      await axios.post(`${SERVER_URL}/api/posts/${postId}/comment`, { comment: newComment });
      socket.emit('comment', { postId, comment: newComment });
      console.log(`New comment added to post ${postId}: ${newComment}`);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
        )
      );
      setNewComment('');
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  return (
    <Box>
      <Box>
        <Typography variant="h4">Instagram Clone</Typography>
        <Box>
          <input
            type="text"
            placeholder="Description"
            value={newPost.description}
            onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
          />
          <input
            type="file"
            onChange={(e) => setNewPost({ ...newPost, image: e.target.files[0] })}
          />
          <button onClick={handlePostSubmit}>Upload</button>
        </Box>
      </Box>
      <Box>
        {posts.map((post) => (
          <Card key={post.id}>
            <CardMedia
              component="img"
              height="300"
              width="300"
              image={`${SERVER_URL}${post.imageUrl}`}
              alt={post.description}
            />
            <CardContent>
              <Typography variant="body1">{post.description}</Typography>
              <Box>
                <IconButton onClick={() => handleLike(post.id)}>
                  <ThumbUpIcon />
                  {post.likes}
                </IconButton>
                <Box>
                  <TextField
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                  />
                  <Button onClick={() => handleComment(post.id)}>Comment</Button>
                </Box>
                {post.comments.map((comment, index) => (
                  <Typography key={index} variant="body2">
                    {comment} 
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default InstagramClone;
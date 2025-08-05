const express = require('express');
const router = express.Router();
const { 
  getOrCreateChat, 
  getUserChats, 
  getChatMessages, 
  markAsRead 
} = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');

// Chat routes
router.get('/task/:taskId', auth, getOrCreateChat);
router.get('/user-chats', auth, getUserChats);
router.get('/:chatId/messages', auth, getChatMessages);
router.put('/:chatId/read', auth, markAsRead);

module.exports = router; 
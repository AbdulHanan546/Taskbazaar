const express = require('express');
const Chat = require('../models/Chat')
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

router.get('/by-task/:taskId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ taskId: req.params.taskId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
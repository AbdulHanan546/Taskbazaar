const Chat = require('../models/Chat');
const Task = require('../models/Task');
const User = require('../models/User');

// Get or create chat for a specific task
exports.getOrCreateChat = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Verify task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is task owner or assigned provider
    // ALLOW: If user is task owner, or assigned provider, or (provider and task is open)
    const isTaskOwner = task.user.toString() === userId;
    const isAssignedProvider = task.provider?.toString() === userId;
    const isProvider = req.user.role === 'provider';
    const isTaskOpen = task.status === 'open';
    if (!isTaskOwner && !isAssignedProvider && !(isProvider && isTaskOpen)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find existing chat or create new one
    let chat = await Chat.findOne({ taskId }).populate('participants', 'name');
    
    if (!chat) {
      // For open tasks, allow chat between task owner and any provider
      const participants = [task.user];
      if (isProvider) {
        participants.push(userId);
      } else if (task.provider) {
        participants.push(task.provider);
      }
      chat = await Chat.create({
        taskId,
        participants
      });
      chat = await Chat.findById(chat._id).populate('participants', 'name');
    } else {
      // If provider is not in participants, add them (for open tasks)
      if (isProvider && isTaskOpen && !chat.participants.some(p => p._id.toString() === userId)) {
        chat.participants.push(userId);
        await chat.save();
        chat = await Chat.findById(chat._id).populate('participants', 'name');
      }
    }

    res.json(chat);
  } catch (err) {
    console.error('Chat creation error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get user's chat list
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const chats = await Chat.find({
      participants: userId
    })
    .populate('taskId', 'title status')
    .populate('participants', 'name')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (err) {
    console.error('Get chats error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get chat messages
const mongoose = require('mongoose');

exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId).populate('participants', 'name');
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(chat.messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Only mark unread messages from others as read
    let updated = false;
    for (const message of chat.messages) {
      if (message.sender.toString() !== userId && !message.read) {
        message.read = true;
        updated = true;
      }
    }

    if (updated) {
      chat.unreadCount = 0;
      await chat.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: err.message });
  }
};

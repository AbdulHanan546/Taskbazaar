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
    if (task.user.toString() !== userId && task.provider?.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find existing chat or create new one
    let chat = await Chat.findOne({ taskId }).populate('participants', 'name');
    
    if (!chat) {
      const participants = [task.user];
      if (task.provider) {
        participants.push(task.provider);
      }

      chat = await Chat.create({
        taskId,
        participants
      });
      
      chat = await Chat.findById(chat._id).populate('participants', 'name');
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
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

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

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark unread messages as read
    await Chat.updateMany(
      { _id: chatId, 'messages.sender': { $ne: userId }, 'messages.read': false },
      { $set: { 'messages.$[].read': true, unreadCount: 0 } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: err.message });
  }
}; 
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const Chat = require('./models/Chat');
const User = require('./models/User');
const Task = require('./models/Task')
dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/uploads', express.static('uploads')); // expose uploads directory

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Handle joining task-specific chat rooms
  socket.on('join-task-chat', async (taskId) => {
    try {
      // Verify user has access to this task
      const chat = await Chat.findOne({ taskId }).populate('participants');
      if (chat && chat.participants.some(p => p._id.toString() === socket.userId)) {
        socket.join(`task_${taskId}`);
        console.log(`User ${socket.userId} joined task chat: ${taskId}`);
      }
    } catch (error) {
      console.error('Error joining task chat:', error);
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { taskId, content, messageType = 'text',clientId } = data;
      
      // Find or create chat for this task
      let chat = await Chat.findOne({ taskId });
      if (!chat) {
        const task = await Task.findById(taskId);
        if (!task) return;

        const participants = [task.user];
        if (task.provider) {
          participants.push(task.provider);
        }

        chat = await Chat.create({
          taskId,
          participants
        });
      }

      // Add message to chat
      const message = {
  sender: socket.userId,
  content,
  messageType,
  timestamp: new Date(),
  clientId  // 👈 ADD THIS
};


      chat.messages.push(message);
      chat.lastMessage = new Date();
      chat.unreadCount += 1;
      await chat.save();

      // Populate sender info for the response
      const populatedChat = await Chat.findById(chat._id)
        .populate('messages.sender', 'name')
        .populate('participants', 'name');

      const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

      // Emit to all participants in the task chat room
      io.to(`task_${taskId}`).emit('new-message', {
        taskId,
        message: newMessage,
        chatId: chat._id
      });

      // Emit unread count update to other participants
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          io.to(`user_${participantId}`).emit('unread-update', {
            taskId,
            unreadCount: chat.unreadCount
          });
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (taskId) => {
    socket.to(`task_${taskId}`).emit('user-typing', {
      userId: socket.userId,
      taskId
    });
  });

  socket.on('typing-stop', (taskId) => {
    socket.to(`task_${taskId}`).emit('user-stop-typing', {
      userId: socket.userId,
      taskId
    });
  });

  // Handle message read receipts
  socket.on('mark-read', async (data) => {
    try {
      const { chatId } = data;
      
      await Chat.updateMany(
        { _id: chatId, 'messages.sender': { $ne: socket.userId }, 'messages.read': false },
        { $set: { 'messages.$[].read': true, unreadCount: 0 } }
      );

      // Notify other participants that messages were read
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            io.to(`user_${participantId}`).emit('messages-read', {
              chatId,
              readBy: socket.userId
            });
          }
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendTaskAssignedNotification } = require('./services/emailService');
    const result = await sendTaskAssignedNotification(
      'test@example.com',
      'Test Task',
      'Test Provider'
    );
    res.json({ success: result, message: 'Email test completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

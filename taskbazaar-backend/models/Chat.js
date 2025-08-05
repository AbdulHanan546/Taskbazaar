const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const chatSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [messageSchema],
  lastMessage: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 }
}, { timestamps: true });

// Index for efficient querying
chatSchema.index({ taskId: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessage: -1 });

module.exports = mongoose.model('Chat', chatSchema); 
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'assigned', 'completed'], default: 'open' },
  images: [String], // <-- Add this line
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);

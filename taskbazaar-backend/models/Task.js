const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
},
rating: { type: Number, min: 1, max: 5, default: null },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'assigned', 'completed','cancelled'], default: 'open' },
    budget: Number,
  images: [String], // <-- Add this line
}, { timestamps: true });
taskSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Task', taskSchema);

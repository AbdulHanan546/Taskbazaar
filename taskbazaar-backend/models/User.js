const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['user', 'provider'], default: 'user' },
  services: [String], // e.g., ['AC repair', 'Plumbing', 'Washing Machine']
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [lng, lat]
  }
});
userSchema.index({ location: '2dsphere' });


module.exports = mongoose.model('User', userSchema);

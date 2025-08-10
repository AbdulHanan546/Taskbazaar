const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String }, // For provider
  cnic: { type: String },  // For provider & employees
  role: { type: String, enum: ['user', 'provider', 'provider_employee'], default: 'user' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For employees
  services: [String], // For provider or employee (can inherit from provider)
location: {
  type: {
    type: String,
    enum: ['Point']
  },
  coordinates: {
    type: [Number]
  }
}

});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);

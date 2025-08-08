const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);

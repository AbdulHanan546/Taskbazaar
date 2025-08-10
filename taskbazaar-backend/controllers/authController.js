const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, services, location, providerId, phone, cnic } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }

    if (role === 'provider' && (!phone || !cnic)) {
      return res.status(400).json({ error: "Phone and CNIC are required for providers" });
    }

    if (role === 'provider_employee') {
      if (!providerId) {
        return res.status(400).json({ error: "Provider ID is required for employees" });
      }
      if (!cnic) {
        return res.status(400).json({ error: "CNIC is required for employees" });
      }
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = { name, email, password: hashedPassword, role };

    if (role === 'provider') {
      userData.phone = phone;
      userData.cnic = cnic;
    }

    if (role === 'provider_employee') {
      userData.providerId = providerId;
      userData.cnic = cnic;
    }

    if (services) userData.services = services;

    if (
      location &&
      location.type === 'Point' &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
    ) {
      userData.location = location;
    }

    // Create user
   const newUser= await User.create(userData);
    res.status(201).json({ message: "User registered successfully" ,_id: newUser._id });

  } catch (err) {
    console.error("User Registration Error:", err);
    res.status(500).json({ error: err.message });
  }
};




// controllers/authController.js
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      providerId: user.providerId || null
    }
  });
};

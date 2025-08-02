const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, role, services, location } = req.body;
  console.log("Request Body:", req.body);

  const hashedPassword = await bcrypt.hash(password, 10);

  // Build userData object with required fields
  const userData = { name, email, password: hashedPassword, role };

  // Only include optional fields if they're valid
  if (services) userData.services = services;

  if (
    location &&
    location.type === 'Point' &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    typeof location.coordinates[0] === 'number' &&
    typeof location.coordinates[1] === 'number'
  ) {
    userData.location = location;
  }
  if (role==="user"){
    userData.location=[]
  }
  try {
    const user = await User.create(userData);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("User Registration Error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

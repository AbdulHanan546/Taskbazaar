const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

exports.registerCompany = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    // Check if company already exists
    const existing = await Company.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Company already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      address,
      phone
    });

    // Optionally, return a JWT token here if you want auto-login

    res.status(201).json({ message: 'Company registered successfully', companyId: company._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

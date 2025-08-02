// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Auth Header:', authHeader); // log this

  if (!authHeader) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user:', decoded); // log the decoded payload
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT verification error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

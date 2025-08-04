const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
connectDB();


app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/uploads', express.static('uploads')); // expose uploads directory

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const { sendTaskAssignedNotification } = require('./services/emailService');
    const result = await sendTaskAssignedNotification(
      'test@example.com',
      'Test Task',
      'Test Provider'
    );
    res.json({ success: result, message: 'Email test completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

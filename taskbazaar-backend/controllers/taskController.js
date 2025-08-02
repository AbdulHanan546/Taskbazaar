const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  const { title, description, location } = req.body;
  console.log('Request body:', req.body);
  console.log('User:', req.user); // this should contain user.id

  try {
    const task = await Task.create({ title, description, location, user: req.user.id });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: 'open' }).populate('user', 'name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


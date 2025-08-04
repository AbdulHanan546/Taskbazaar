const Task = require('../models/Task');
const User = require('../models/User');
const { 
  sendTaskAssignedNotification, 
  sendTaskCompletedNotification, 
  sendTaskCancelledNotification 
} = require('../services/emailService');
exports.createTask = async (req, res) => {
  const imagePaths = req.files ? req.files.map(file => file.filename) : [];
  let parsedLocation;
console.log("Received BUDGET type & value:", typeof req.body.budget, req.body.budget);

  try {
    parsedLocation = JSON.parse(req.body.location);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid location data' });
  }

  if (!parsedLocation || !parsedLocation.longitude || !parsedLocation.latitude) {
    return res.status(400).json({ error: 'Missing location coordinates' });
  }

  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      location: {
        type: 'Point',
        coordinates: [parsedLocation.longitude, parsedLocation.latitude], // Mongo expects [lng, lat]
      },
      user: req.user.id,
      budget: parseFloat(req.body.budget),
      images: imagePaths,
    });

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

exports.getNearbyTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'provider') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!user.location || !user.location.coordinates || user.location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Provider location is missing or invalid' });
    }

    const maxDistanceInMeters = 5000; // 5 km

    // Build case-insensitive regex for each service
    const serviceRegex = user.services.map(service => ({
      $or: [
        { title: { $regex: service, $options: 'i' } },
        { description: { $regex: service, $options: 'i' } }
      ]
    }));

    const tasks = await Task.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates,
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
      status: 'open',
      ...(user.services.length > 0 && { $or: serviceRegex })
    });

    res.json(tasks);
  } catch (err) {
    console.error('Nearby Task Fetch Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update task status and send email notification
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, providerId } = req.body;

    const task = await Task.findById(taskId).populate('user', 'email name');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is authorized to update this task
    if (task.user._id.toString() !== req.user.id && req.user.role !== 'provider') {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const oldStatus = task.status;
    task.status = status;

    // If assigning to a provider, populate provider info
    if (status === 'assigned' && providerId) {
      const provider = await User.findById(providerId);
      if (provider) {
        task.provider = providerId;
      }
    }

    await task.save();

    // Send email notification based on status change
    let emailSent = false;
    
    if (status === 'assigned' && oldStatus === 'open') {
      const provider = await User.findById(providerId);
      if (provider && task.user.email) {
        emailSent = await sendTaskAssignedNotification(
          task.user.email, 
          task.title, 
          provider.name
        );
      }
    } else if (status === 'completed' && oldStatus === 'assigned') {
      if (task.user.email) {
        emailSent = await sendTaskCompletedNotification(
          task.user.email, 
          task.title
        );
      }
    } else if (status === 'cancelled') {
      if (task.user.email) {
        emailSent = await sendTaskCancelledNotification(
          task.user.email, 
          task.title
        );
      }
    }

    res.json({ 
      task, 
      emailSent,
      message: `Task status updated to ${status}${emailSent ? ' and notification sent' : ''}`
    });

  } catch (err) {
    console.error('Task Status Update Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Accept task (for providers)
exports.acceptTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('user', 'email name');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ error: 'Task is not available for assignment' });
    }

    // Update task
    task.status = 'assigned';
    task.provider = req.user.id;
    await task.save();

    // Fetch provider details
    const provider = await User.findById(req.user.id);

    // Send email notification
    let emailSent = false;
    if (task.user.email && provider?.name) {
      emailSent = await sendTaskAssignedNotification(
        task.user.email,
        task.title,
        provider.name
      );
    }

    res.json({ 
      task, 
      emailSent,
      message: `Task accepted successfully${emailSent ? ' and notification sent' : ''}`
    });

  } catch (err) {
    console.error('Task Acceptance Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      provider: req.user.id,
      status: { $in: ['assigned', 'completed'] }
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

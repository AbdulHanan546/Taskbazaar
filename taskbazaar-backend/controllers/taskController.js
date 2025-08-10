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
    // Fetch tasks with populated provider info
    const tasks = await Task.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('provider', 'name email');

    // Get all provider IDs from these tasks
    const providerIds = tasks
      .map(task => task.provider?._id)
      .filter(Boolean);

    // Aggregate avg rating per provider across all tasks
    const ratingsAgg = await Task.aggregate([
      { $match: { provider: { $in: providerIds }, rating: { $ne: null } } },
      {
        $group: {
          _id: '$provider',
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    // Map providerId to avgRating
    const avgRatingsMap = {};
    ratingsAgg.forEach(r => {
      avgRatingsMap[r._id.toString()] = r.avgRating;
    });

    // Attach avgRating to each task's provider
    const tasksWithAvgRating = tasks.map(task => {
      const provider = task.provider ? task.provider.toObject() : null;
      if (provider) {
        provider.avgRating = avgRatingsMap[provider._id.toString()] ?? null;
      }
      return {
        ...task.toObject(),
        provider
      };
    });

    res.json(tasksWithAvgRating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getNearbyTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !['provider', 'provider_employee'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let location = user.location;
    let services = user.services || [];

    // If employee, inherit provider location & services
    if (user.role === 'provider_employee' && user.providerId) {
      const provider = await User.findById(user.providerId);
      if (provider) {
        location = provider.location;
        services = provider.services;
      }
    }

    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Provider location is missing or invalid' });
    }

    const maxDistanceInMeters = 5000;

    const serviceRegex = services.map(service => ({
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
            coordinates: location.coordinates,
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
      status: 'open',
      ...(services.length > 0 && { $or: serviceRegex })
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
    const user = await User.findById(req.user.id);

    if (!user || !['provider', 'provider_employee'].includes(user.role)) {
      return res.status(403).json({ error: 'Only providers or employees can accept tasks' });
    }

    // populate task.user so we can access their email & name
    const task = await Task.findById(taskId).populate('user');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'open') return res.status(400).json({ error: 'Task is not available' });

    const providerId = user.role === 'provider_employee' ? user.providerId : user._id;

    task.status = 'assigned';
    task.provider = providerId;
    task.assignedEmployee = user._id;
    await task.save();

    // Send email notification to the task owner
    let emailSent = false;
    try {
      emailSent = await sendTaskAssignedNotification(task.user.email, task.title, user.name);
    } catch (err) {
      console.error('Failed to send task assigned email:', err);
    }

    res.json({ task, message: 'Task accepted successfully', emailSent });
  } catch (err) {
    console.error('Accept Task Error:', err);
    res.status(500).json({ error: err.message });
  }
};
// controllers/taskController.js
exports.rateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const task = await Task.findById(taskId).populate('provider');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed tasks' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to rate this task' });
    }

    task.rating = rating;
    await task.save();

    res.json({ message: 'Rating submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

exports.getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      provider: req.user.id,
      status: { $in: ['assigned', 'completed'] }
    })
    .populate('assignedEmployee', 'name email') // shows who accepted the task
    .populate('user', 'name email') // shows who created the task
    .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


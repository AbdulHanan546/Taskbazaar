const Task = require('../models/Task');
const User = require('../models/User');
const Chat = require('../models/Chat'); // import chat model
const { 
  sendTaskAssignedNotification, 
  sendTaskCompletedNotification, 
  sendTaskCancelledNotification 
} = require('../services/emailService');
const axios = require("axios");

async function coordsToAddress(lon, lat) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=en`;
    const res = await axios.get(url, { headers: { "User-Agent": "TaskBazaar/1.0" } });

    const addr = res.data.address || {};

    // Possible sources for the first part (town/neighbourhood)
    const townName = addr.suburb || addr.neighbourhood || addr.town || addr.village || null;

    // Possible sources for the tehsil (city_district, county, or municipality)
    const tehsilName = addr.city_district || addr.county || null;

    if (townName && tehsilName) return `${townName}, ${tehsilName}`;
    if (townName) return townName;
    if (tehsilName) return tehsilName;

    return "Unknown location";
  } catch (err) {
    console.error("Reverse geocoding failed:", err.message);
    return "Unknown location";
  }
}




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
    const tasks = await Task.find({ 
        user: req.user.id,
        $or: [
          { status: { $nin: ["cancelled"] } }, // all non-cancelled tasks
          { providerCompleted: true }          // include tasks completed by provider
        ]
      })
      .sort({ createdAt: -1 })
      .populate('provider', 'name email');

    const providerIds = tasks
      .map(task => task.provider?._id)
      .filter(Boolean);

    const ratingsAgg = await Task.aggregate([
      { $match: { provider: { $in: providerIds }, rating: { $ne: null } } },
      {
        $group: {
          _id: '$provider',
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const avgRatingsMap = {};
    ratingsAgg.forEach(r => {
      avgRatingsMap[r._id.toString()] = r.avgRating;
    });

    const tasksWithExtras = await Promise.all(tasks.map(async task => {
      const provider = task.provider ? task.provider.toObject() : null;
      if (provider) {
        provider.avgRating = avgRatingsMap[provider._id.toString()] ?? null;
      }

      let address = task.location?.address || null;
      if (!address && task.location?.coordinates?.length === 2) {
        try {
          const lat = task.location.coordinates[1];
          const lon = task.location.coordinates[0];
          address = await coordsToAddress(lon, lat);

          // Save for future requests
          task.location.address = address;
          await task.save();
        } catch (err) {
          console.error("Address lookup failed:", err.message);
        }
      }

      return {
        ...task.toObject(),
        provider,
        location: {
          ...task.location.toObject?.() ?? task.location,
          address
        },
        // New fields for frontend
        userCompleted: task.userCompleted ?? false,
        providerCompleted: task.providerCompleted ?? false,
        paymentStatus: task.paymentStatus ?? 'pending'
      };
    }));

    res.json(tasksWithExtras);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





const sleep = ms => new Promise(res => setTimeout(res, ms));

exports.getNearbyTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !['provider', 'provider_employee'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let location = user.location;
    let services = user.services || [];

    if (user.role === 'provider_employee' && user.providerId) {
      const provider = await User.findById(user.providerId);
      if (provider) {
        location = provider.location;
        services = provider.services;
      }
    }

    if (!location?.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ error: 'Provider location is missing or invalid' });
    }

    const maxDistanceInMeters = 5000;

    // ✅ Split services into keywords for partial matching
    const serviceRegex = [];
    services.forEach(service => {
      const keywords = service.split(" "); // e.g., "laptop repair" → ["laptop", "repair"]
      keywords.forEach(keyword => {
        serviceRegex.push({
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } }
          ]
        });
      });
    });

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
      ...(serviceRegex.length > 0 && { $or: serviceRegex }) // ✅ match if any keyword matches
    });

    const tasksWithAddresses = await Promise.all(tasks.map(async (task) => {
      let address = task.location?.address || null;

      if (!address && task.location?.coordinates?.length === 2) {
        try {
          await sleep(300); // avoid 429 errors
          address = await coordsToAddress(
            task.location.coordinates[0],
            task.location.coordinates[1]
          );
          task.location.address = address;
          await task.save();
        } catch (err) {
          console.error(`Geocoding failed for task ${task._id}:`, err.message);
        }
      }

      return {
        ...task.toObject(),
        location: {
          ...task.location,
          address
        }
      };
    }));

    res.json(tasksWithAddresses);
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

    // 🚫 Prevent cancellation if payment already initiated
    if (status === 'cancelled' && task.paymentStatus === 'initiated') {
      return res.status(400).json({ error: 'Task cannot be cancelled after payment has been initiated' });
    }

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


const stripe = require('../stripe');


exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId).populate('user provider');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Only task poster or provider can mark complete
    if (![task.user._id.toString(), task.provider._id.toString()].includes(userId)) {
      return res.status(403).json({ error: 'Not authorized to complete this task' });
    }

    // Update completion flags
    if (userId === task.user._id.toString()) task.userCompleted = true;
    if (userId === task.provider._id.toString()) task.providerCompleted = true;

    await task.save();

    // If both completed, trigger Stripe payment
    if (task.userCompleted && task.providerCompleted && task.paymentStatus !== 'initiated') {
  const amount = task.budget * 100; // cents
  const commission = Math.round(amount * 0.10);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card'],
    metadata: { taskId: task._id.toString(), commission },
  });

  task.stripePaymentIntentId = paymentIntent.id;
  task.paymentStatus = 'initiated';
  await task.save();

  return res.json({ task, message: 'Both marked completed. Payment initiated (test mode).' });
}


    res.json({ task, message: 'Marked as completed. Waiting for other party.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const task = await Task.findById(paymentIntent.metadata.taskId);
      if (task) {
        task.paymentStatus = 'paid';
        await task.save();
      }
      break;
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      const failedTask = await Task.findById(failedIntent.metadata.taskId);
      if (failedTask) {
        failedTask.paymentStatus = 'failed';
        await failedTask.save();
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
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

    let chat = await Chat.findOne({ taskId: task._id });
if (!chat) {
  chat = new Chat({
    taskId: task._id,
    participants: [task.user._id, providerId] // provider always included
  });
}

// If employee is different from provider, add them too
if (user.role === 'provider_employee' && !chat.participants.includes(user._id)) {
  chat.participants.push(user._id);
}

// Ensure provider is in participants
if (!chat.participants.includes(providerId)) {
  chat.participants.push(providerId);
}

await chat.save();

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
    const providerId = req.user.id;

    // ✅ Get employees under this provider
    let employees = [];
    if (req.user.role === "provider") {
      employees = await User.find({ providerId })
        .select("_id name email profession");
    }

    // ✅ Get active assigned tasks for provider or their employees
    const activeTasks = await Task.find({
      $or: [
        { provider: providerId },
        { assignedEmployee: { $in: employees.map(e => e._id) } }
      ],
      status: { $in: ["assigned"] }
    })
      .populate("assignedEmployee", "name email profession")
      .populate("provider", "name email");

    // ✅ Get tasks marked as completed by the task poster (userCompleted)
    const userCompletedTasks = await Task.find({
      $or: [
        { provider: providerId },
        { assignedEmployee: { $in: employees.map(e => e._id) } }
      ],
      userCompleted: true
    })
      .populate("assignedEmployee", "name email profession")
      .populate("provider", "name email");

    // ✅ Format employees with work status
    const employeesWithStatus = employees.map(emp => {
      const hasActiveTask = activeTasks.some(
        t => t.assignedEmployee && t.assignedEmployee._id.toString() === emp._id.toString()
      );
      return {
        id: emp._id,
        name: emp.name,
        email: emp.email,
        profession: emp.profession || '',
        status: hasActiveTask ? "at-work" : "free"
      };
    });

    // ✅ Send datasets: active tasks + userCompleted tasks
    res.json({
      employees: employeesWithStatus,
      tasks: activeTasks,
      userCompletedTasks  // added this
    });

  } catch (err) {
    console.error("Get assigned tasks error:", err);
    res.status(500).json({ error: err.message });
  }
};






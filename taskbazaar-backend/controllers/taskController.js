const Task = require('../models/Task');
const User = require('../models/User')
exports.createTask = async (req, res) => {
  const imagePaths = req.files ? req.files.map(file => file.filename) : [];
  let parsedLocation;

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


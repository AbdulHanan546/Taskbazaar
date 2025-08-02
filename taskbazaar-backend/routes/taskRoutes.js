const express = require('express');
const router = express.Router();
const { createTask, getTasks,getUserTasks ,getNearbyTasks} = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', auth,upload.array('images', 5), createTask);
router.get('/my', auth, getUserTasks);
router.get('/nearby',auth,getNearbyTasks)
module.exports = router;

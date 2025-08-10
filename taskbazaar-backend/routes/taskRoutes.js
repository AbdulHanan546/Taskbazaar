const express = require('express');
const router = express.Router();
const { createTask, getTasks, getUserTasks, getNearbyTasks, updateTaskStatus, acceptTask,getAssignedTasks,rateTask } = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', auth, upload.array('images', 5), createTask);
router.get('/my', auth, getUserTasks);
router.get('/nearby', auth, getNearbyTasks);

// New routes for task status updates and acceptance
router.put('/:taskId/status', auth, updateTaskStatus);
router.post('/:taskId/accept', auth, acceptTask);
router.get('/assigned', auth, getAssignedTasks);
router.put('/:taskId/rating', auth, rateTask);

module.exports = router;

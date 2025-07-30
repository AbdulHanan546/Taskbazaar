const express = require('express');
const router = express.Router();
const { createTask, getTasks,getUserTasks } = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, createTask);
router.get('/my', auth, getUserTasks);

module.exports = router;

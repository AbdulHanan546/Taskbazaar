const express = require('express');
const router = express.Router();
const { createTask, getTasks,getUserTasks } = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', auth,upload.array('images', 5), createTask);
router.get('/my', auth, getUserTasks);

module.exports = router;

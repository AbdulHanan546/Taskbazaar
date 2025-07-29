const express = require('express');
const router = express.Router();
const { createTask, getTasks } = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, createTask);
router.get('/', auth, getTasks);

module.exports = router;

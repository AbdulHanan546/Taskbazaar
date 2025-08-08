const express = require('express');
const router = express.Router();
const { registerCompany } = require('../controllers/companyController');

router.post('/register', registerCompany);

module.exports = router;

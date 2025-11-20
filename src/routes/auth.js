const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  loginCustomer,
  loginAdmin,
  loginStaff,
  getProfile,
  updateProfile
} = require('../controllers/authController');

const router = express.Router();


const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];


router.post('/login/customer', loginValidation, loginCustomer);
router.post('/login/admin', loginValidation, loginAdmin);
router.post('/login/staff', loginValidation, loginStaff);


router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;

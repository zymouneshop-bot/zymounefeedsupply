const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { changeStaffPassword, adminSetStaffPassword } = require('../controllers/staffController');
// Reset password via token
router.post('/reset-password', staffController.resetPassword);
// Forgot password (send reset email)
router.post('/forgot-password', staffController.forgotPassword);

// Admin: Set new password for any staff by ID
router.post('/:id/set-password', authenticateToken, requireAdmin, adminSetStaffPassword);
// Change password (staff self-service)
router.post('/change-password', authenticateToken, changeStaffPassword);

// Public endpoint to view staff list
router.get('/', staffController.getAllStaff);

router.post('/', authenticateToken, requireAdmin, staffController.addStaff);


router.delete('/clear-all', authenticateToken, requireAdmin, staffController.clearAllStaff);


router.post('/check-email', authenticateToken, requireAdmin, staffController.checkEmailAvailability);


router.put('/:id', authenticateToken, requireAdmin, staffController.updateStaff);


router.delete('/:id', authenticateToken, requireAdmin, staffController.deleteStaff);


router.post('/:id/resend', authenticateToken, requireAdmin, staffController.resendInvitation);

// Pause staff account
router.put('/:id/pause', authenticateToken, requireAdmin, staffController.pauseStaff);

// Activate staff account
router.put('/:id/activate', authenticateToken, requireAdmin, staffController.activateStaff);

module.exports = router;

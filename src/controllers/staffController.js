// Reset Password via Token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log('🔑 Received reset token:', token);
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password are required.' });
    }
    const staff = await Staff.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    console.log('🔍 Staff found for token:', staff ? staff.email : null);
    if (!staff) {
      console.log('❌ No staff found or token expired for:', token);
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
    }
    staff.password = newPassword;
    staff.resetPasswordToken = undefined;
    staff.resetPasswordExpires = undefined;
    await staff.save();
    // Also update User collection if a user with this email exists
    const user = await User.findOne({ email: staff.email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
    res.json({ success: true, message: 'Password has been reset.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
// Forgot Password Handler
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });
    const staff = await Staff.findOne({ email });
    if (!staff) return res.status(404).json({ success: false, error: 'No staff found with that email.' });

    // Generate a simple reset token (for demo; use crypto in production)
    const resetToken = Math.random().toString(36).substr(2, 8);
    staff.resetPasswordToken = resetToken;
    staff.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 min expiry
    await staff.save();

    // Send real password reset email
    const EmailServiceClass = require('../services/emailService');
    const emailService = new EmailServiceClass();
    const emailResult = await emailService.sendPasswordReset(email, resetToken);
    if (emailResult.success) {
      res.json({ success: true, message: 'Reset link sent (check email)' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send reset email', details: emailResult.error });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

module.exports.forgotPassword = forgotPassword;
// Admin: Set new password for any staff by ID
const adminSetStaffPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required.' });
    }
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found.' });
    }
    staff.password = newPassword;
    staff.temporaryPassword = null;
    await staff.save();
    // Debug: log plain and hashed password after save
    const updatedStaff = await Staff.findById(id);
    console.log('[DEBUG] Admin set password:', {
      email: updatedStaff.email,
      plainPassword: newPassword,
      hashedPassword: updatedStaff.password
    });
    // Also update User collection if a user with this email exists
    const user = await User.findOne({ email: staff.email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error setting staff password (admin):', error);
    res.status(500).json({ success: false, error: 'Failed to set password', details: error.message });
  }
};
// Change password for staff (self-service)
const changeStaffPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Old and new password are required.' });
    }
    // Find staff by email from req.user
    const staff = await Staff.findOne({ email: req.user.email });
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found.' });
    }
    // Check old password against both main and temporary password, with detailed debug logs
    const bcrypt = require('bcryptjs');
    let isMatch = await staff.correctPassword(oldPassword, staff.password);
    let matchedField = 'password';
    let tempMatch = false;
    if (!isMatch && staff.temporaryPassword) {
      tempMatch = await staff.correctPassword(oldPassword, staff.temporaryPassword);
      if (tempMatch) {
        isMatch = true;
        matchedField = 'temporaryPassword';
      }
    }
    // Debug: log detailed comparison info
    const passwordCompare = await bcrypt.compare(oldPassword, staff.password);
    const tempPasswordCompare = staff.temporaryPassword ? await bcrypt.compare(oldPassword, staff.temporaryPassword) : null;
    console.log('[DEBUG] Change password attempt:', {
      email: staff.email,
      oldPasswordAttempt: oldPassword,
      passwordHash: staff.password,
      tempPasswordHash: staff.temporaryPassword,
      passwordCompare,
      tempPasswordCompare,
      matchedField,
      isMatch
    });
    if (!isMatch) {
      // Extra debug: show what is being compared when old password is incorrect
      const bcrypt = require('bcryptjs');
      let plainVsHash = false;
      let hashVsHash = false;
      try {
        // Compare entered oldPassword as plain text to stored hash
        plainVsHash = await bcrypt.compare(oldPassword, staff.password);
        // Compare entered oldPassword as if it were a hash (not typical, but for debug)
        hashVsHash = oldPassword === staff.password;
      } catch (e) {}
      console.log('[DEBUG] Old password incorrect:', {
        email: staff.email,
        enteredOldPassword: oldPassword,
        storedPasswordHash: staff.password,
        plainVsHash,
        hashVsHash
      });
      return res.status(401).json({ success: false, error: 'Old password is incorrect.' });
    }
    staff.password = newPassword;
    staff.temporaryPassword = null;
    await staff.save();
    // Also update User collection if a user with this email exists
    const user = await User.findOne({ email: staff.email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing staff password:', error);
    res.status(500).json({ success: false, error: 'Failed to change password', details: error.message });
  }
};
const EmailService = require('../services/emailService');
const Staff = require('../models/Staff');
const User = require('../models/User');


const getAllStaff = async (req, res) => {
  try {
    console.log('🔍 Querying staff from database...');
    console.log('🔍 Database connection state:', Staff.db.readyState);
    
    const staff = await Staff.find({})
      .select('-password -temporaryPassword')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    console.log('📊 Database query returned:', staff.length, 'staff members');
    console.log('📊 Staff data from database:', staff.map(s => ({ 
      id: s._id, 
      name: s.firstName + ' ' + s.lastName, 
      status: s.status,
      email: s.email,
      createdAt: s.createdAt
    })));
    
    
    const totalCount = await Staff.countDocuments({});
    console.log('📊 Total staff count in database:', totalCount);
    
    res.json({
      success: true,
      staff: staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff',
      details: error.message
    });
  }
};


const addStaff = async (req, res) => {
  try {
    console.log('📝 Adding new staff with data:', req.body);
    console.log('📝 Request headers:', req.headers);
    console.log('📝 Request method:', req.method);
    console.log('👤 User info:', req.user);
    
    const { firstName, lastName, email, role } = req.body;
    
    
    const staffRole = 'staff';
    
    console.log('📝 Extracted fields:', { firstName, lastName, email, role: staffRole });
    
    
    if (!firstName || !lastName || !email) {
      console.log('❌ Validation failed: Missing required fields');
      console.log('❌ firstName:', firstName, 'lastName:', lastName, 'email:', email);
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and email are required'
      });
    }
    
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ Email already exists in User collection:', email);
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'This email address is already registered. Please use a different email address.'
      });
    }
    
    
    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      console.log('❌ Email already exists in Staff collection:', email);
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'This email address is already registered. Please use a different email address.'
      });
    }
    
    
    try {
      const sampleMflixDb = Staff.db.client.db('sample_mflix');
      const existingStaffInSample = await sampleMflixDb.collection('staffs').findOne({ email: email.toLowerCase() });
      if (existingStaffInSample) {
        console.log('❌ Email already exists in sample_mflix database:', email);
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
          message: 'This email address is already registered in our system. Please use a different email address.'
        });
      }
    } catch (error) {
      console.log('⚠️ Could not check sample_mflix database:', error.message);
    }
    
    
    const temporaryPassword = EmailService.generateTemporaryPassword();
    console.log('🔑 Generated temporary password');
    
    
    const newStaff = new Staff({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: temporaryPassword, 
      role: staffRole, 
      status: 'pending',
      temporaryPassword: temporaryPassword,
      createdBy: req.user?.id || null 
    });
    
    
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: temporaryPassword, 
      role: staffRole, 
      isActive: true
    });
    
    console.log('💾 Saving staff to database...');
    console.log('💾 Staff object before save:', newStaff);
    console.log('💾 User object before save:', newUser);
    console.log('💾 Database connection state:', newStaff.db.readyState);
    
    
    const savedStaff = await newStaff.save();
    const savedUser = await newUser.save();
    
    console.log('✅ Staff saved successfully with ID:', savedStaff._id);
    console.log('✅ User saved successfully with ID:', savedUser._id);
    console.log('✅ Saved staff object:', savedStaff);
    console.log('✅ Saved user object:', savedUser);
    
    
    const verifyStaff = await Staff.findById(savedStaff._id);
    const verifyUser = await User.findById(savedUser._id);
    console.log('🔍 Verification query result - Staff:', verifyStaff);
    console.log('🔍 Verification query result - User:', verifyUser);
    
    
    console.log('📧 Sending invitation email...');
    console.log('📧 Temporary password being passed to email service:', temporaryPassword);
    const emailService = new EmailService();
    const emailResult = await emailService.sendStaffInvitation({
      firstName: newStaff.firstName,
      lastName: newStaff.lastName,
      email: newStaff.email,
      role: newStaff.role
    }, temporaryPassword);
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully');
      console.log('📧 Email service returned password:', emailResult.temporaryPassword);
      
      const staffResponse = newStaff.toObject();
      delete staffResponse.password;
      delete staffResponse.temporaryPassword;
      
      res.json({
        success: true,
        message: 'Staff invitation sent successfully',
        staff: staffResponse,
        temporaryPassword: emailResult.temporaryPassword 
      });
    } else {
      console.log('❌ Email failed, deleting staff record');
      
      await Staff.findByIdAndDelete(newStaff._id);
      
      res.status(500).json({
        success: false,
        error: 'Failed to send invitation email',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('❌ Error adding staff:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to add staff',
      details: error.message
    });
  }
};


const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, status } = req.body;
    
    
    const staffMember = await Staff.findById(id);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    
    if (email && email !== staffMember.email) {
      const existingStaff = await Staff.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }
    
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    const updatedStaff = await Staff.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password -temporaryPassword');
    
    res.json({
      success: true,
      message: 'Staff updated successfully',
      staff: updatedStaff
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff',
      details: error.message
    });
  }
};


const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    
    const staffMember = await Staff.findById(id);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    console.log('🗑️ Deleting staff member:', staffMember.email);
    
    
    const staffResult = await Staff.findByIdAndDelete(id);
    const userResult = await User.findOneAndDelete({ email: staffMember.email });
    
    console.log('🗑️ Staff deletion result:', staffResult ? 'Success' : 'Failed');
    console.log('🗑️ User deletion result:', userResult ? 'Success' : 'Failed');
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully',
      deletedStaff: staffResult ? 'Yes' : 'No',
      deletedUser: userResult ? 'Yes' : 'No'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff',
      details: error.message
    });
  }
};


const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const staffMember = await Staff.findById(id);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    
    const newTemporaryPassword = EmailService.generateTemporaryPassword();
    
    
    staffMember.password = newTemporaryPassword;
    staffMember.temporaryPassword = newTemporaryPassword;
    await staffMember.save();
    
    
    const emailService = new EmailService();
    const emailResult = await emailService.sendStaffInvitation({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      role: staffMember.role
    });
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Invitation resent successfully',
        temporaryPassword: emailResult.temporaryPassword 
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to resend invitation',
        details: emailResult.error
      });
    }
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation',
      details: error.message
    });
  }
};


const clearAllStaff = async (req, res) => {
  try {
    console.log('🗑️ Clearing all staff members...');
    
    
    const staffResult = await Staff.deleteMany({});
    const userResult = await User.deleteMany({ role: { $in: ['staff', 'manager', 'cashier'] } });
    
    console.log('🗑️ Staff deletion result:', staffResult.deletedCount, 'staff members deleted');
    console.log('🗑️ User deletion result:', userResult.deletedCount, 'user accounts deleted');
    
    res.json({
      success: true,
      message: `Successfully removed ${staffResult.deletedCount} staff members and ${userResult.deletedCount} user accounts`,
      deletedStaffCount: staffResult.deletedCount,
      deletedUserCount: userResult.deletedCount
    });
  } catch (error) {
    console.error('Error clearing all staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all staff',
      details: error.message
    });
  }
};


const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    
    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      return res.json({
        success: true,
        available: false,
        message: 'Email already exists in feeds_store database'
      });
    }
    
    
    try {
      const sampleMflixDb = Staff.db.client.db('sample_mflix');
      const existingStaffInSample = await sampleMflixDb.collection('staffs').findOne({ email: email.toLowerCase() });
      if (existingStaffInSample) {
        return res.json({
          success: true,
          available: false,
          message: 'Email already exists in sample_mflix database'
        });
      }
    } catch (error) {
      console.log('⚠️ Could not check sample_mflix database:', error.message);
    }
    
    res.json({
      success: true,
      available: true,
      message: 'Email is available'
    });
  } catch (error) {
    console.error('Error checking email availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability',
      details: error.message
    });
  }
};

// Pause staff account
const pauseStaff = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⏸️ Pausing staff with ID:', id);
    
    const staffMember = await Staff.findById(id);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    if (staffMember.status === 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Staff account is already paused'
      });
    }
    
    // Update staff status to paused
    staffMember.status = 'paused';
    await staffMember.save();
    
    console.log('✅ Staff account paused successfully:', staffMember.email);
    
    res.json({
      success: true,
      message: 'Staff account paused successfully',
      staff: {
        id: staffMember._id,
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        email: staffMember.email,
        status: staffMember.status
      }
    });
  } catch (error) {
    console.error('Error pausing staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause staff account',
      details: error.message
    });
  }
};

// Activate staff account
const activateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('▶️ Activating staff with ID:', id);
    
    const staffMember = await Staff.findById(id);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }
    
    if (staffMember.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Staff account is already active'
      });
    }
    
    // Update staff status to active
    staffMember.status = 'active';
    await staffMember.save();
    
    console.log('✅ Staff account activated successfully:', staffMember.email);
    
    res.json({
      success: true,
      message: 'Staff account activated successfully',
      staff: {
        id: staffMember._id,
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        email: staffMember.email,
        status: staffMember.status
      }
    });
  } catch (error) {
    console.error('Error activating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate staff account',
      details: error.message
    });
  }
};

module.exports = {
  getAllStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  resendInvitation,
  clearAllStaff,
  checkEmailAvailability,
  pauseStaff,
  activateStaff,
  changeStaffPassword,
  adminSetStaffPassword,
  forgotPassword,
  resetPassword
};

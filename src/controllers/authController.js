const User = require('../models/User');
const Staff = require('../models/Staff');
const jwt = require('jsonwebtoken');


const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};



const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email, role: 'customer' });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    
    user.lastLogin = new Date();
    await user.save();

    
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message 
    });
  }
};


const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    
    user.lastLogin = new Date();
    await user.save();

    
    const token = generateToken(user._id);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message 
    });
  }
};


const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First try to find in User collection
    let user = await User.findOne({ 
      email, 
      role: { $in: ['manager', 'cashier', 'staff', 'customer'] } 
    });

    // If not found in User, try Staff collection
    if (!user) {
      const Staff = require('../models/Staff');
      user = await Staff.findOne({ email });
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }
    }

    // Check if account is active
    if (!user.isActive && user.isActive !== undefined) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact your administrator.' 
      });
    }

    // Verify password (for Staff model, check both password and temporaryPassword)
    let isPasswordValid = false;
    if (user.comparePassword) {
      isPasswordValid = await user.comparePassword(password);
    }
    // If user is a Staff and has a temporaryPassword, check that too
    if (!isPasswordValid && user.temporaryPassword) {
      const bcrypt = require('bcryptjs');
      isPasswordValid = await bcrypt.compare(password, user.temporaryPassword);
    }
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Check staff status
    if (['manager', 'cashier', 'staff'].includes(user.role)) {
      try {
        const Staff = require('../models/Staff');
        const staffMember = await Staff.findOne({ email: user.email });
        if (staffMember) {
          // Check if staff account is paused
          if (staffMember.status === 'paused') {
            return res.status(401).json({ 
              error: 'Account is paused. Please contact your administrator.' 
            });
          }
          
          // Update staff status to active if it was pending
          if (staffMember.status === 'pending') {
            staffMember.status = 'active';
            staffMember.lastLogin = new Date();
            await staffMember.save();
          }
        }
      } catch (staffError) {
        // Not critical if staff lookup fails
        console.error('Error updating staff status:', staffError);
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message 
    });
  }
};


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get profile', 
      details: error.message 
    });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update profile', 
      details: error.message 
    });
  }
};

module.exports = {
  loginCustomer,
  loginAdmin,
  loginStaff,
  getProfile,
  updateProfile,
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required.' });

      // Try to find user in User collection
      let user = await User.findOne({ email });
      let staff = null;
      let isStaff = false;
      if (!user) {
        staff = await Staff.findOne({ email });
        if (!staff) return res.status(404).json({ error: 'Email not found.' });
        isStaff = true;
      }

      // Generate new password
      const EmailService = require('../services/emailService');
      const newPassword = EmailService.generateTemporaryPassword();


      // Set both password and temporaryPassword to the plain newPassword (pre-save hook will hash)
      if (isStaff) {
        staff.password = newPassword;
        staff.temporaryPassword = newPassword;
        await staff.save();
        // Send email to staff
        await new EmailService().sendStaffInvitation(staff, newPassword);
      } else {
        user.password = newPassword;
        await user.save();
        // Send email to user
        await new EmailService().sendStaffInvitation(user, newPassword);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Failed to reset password.' });
    }
  }
};

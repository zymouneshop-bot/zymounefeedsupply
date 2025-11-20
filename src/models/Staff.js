const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['admin', 'manager', 'cashier', 'staff'],
      message: 'Role must be one of: admin, manager, cashier, staff'
    },
    default: 'staff'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending', 'paused'],
      message: 'Status must be one of: active, inactive, pending, paused'
    },
    default: 'pending'
  },
  temporaryPassword: {
    type: String,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


staffSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});



staffSchema.index({ status: 1 });
staffSchema.index({ role: 1 });


staffSchema.pre('save', async function(next) {
  
  if (!this.isModified('password')) return next();
  
  try {
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


staffSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; 
  next();
});


staffSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


staffSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};


staffSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};


staffSchema.statics.getActiveStaff = function() {
  return this.find({ status: 'active' }).select('-password -temporaryPassword');
};


staffSchema.statics.getStaffByRole = function(role) {
  return this.find({ role, status: 'active' }).select('-password -temporaryPassword');
};

module.exports = mongoose.model('Staff', staffSchema);

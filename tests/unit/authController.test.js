const { loginStaff } = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const Staff = require('../../src/models/Staff');
const jwt = require('jsonwebtoken');


jest.mock('../../src/models/User');
jest.mock('../../src/models/Staff');
jest.mock('jsonwebtoken');

describe('AuthController - Staff Login', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {
        email: 'staff@example.com',
        password: 'password123'
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    
    jest.clearAllMocks();
  });

  it('should update staff status to active when staff member logs in successfully', async () => {
    
    const mockUser = {
      _id: 'user123',
      email: 'staff@example.com',
      role: 'staff',
      isActive: true,
      firstName: 'John',
      lastName: 'Doe',
      lastLogin: null,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    
    const mockStaff = {
      _id: 'staff123',
      email: 'staff@example.com',
      status: 'pending',
      lastLogin: null,
      save: jest.fn().mockResolvedValue(true)
    };

    
    const mockToken = 'mock-jwt-token';
    jwt.sign.mockReturnValue(mockToken);

    
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);

    
    await loginStaff(mockReq, mockRes);

    
    expect(User.findOne).toHaveBeenCalledWith({
      email: 'staff@example.com',
      role: { $in: ['manager', 'cashier', 'staff', 'customer'] }
    });

    
    expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');

    
    expect(mockUser.lastLogin).toBeInstanceOf(Date);
    expect(mockUser.save).toHaveBeenCalled();

    
    expect(Staff.findOne).toHaveBeenCalledWith({ email: 'staff@example.com' });

    
    expect(mockStaff.status).toBe('active');
    expect(mockStaff.lastLogin).toBeInstanceOf(Date);
    expect(mockStaff.save).toHaveBeenCalled();

    
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: 'user123' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token: mockToken,
      user: {
        id: 'user123',
        email: 'staff@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'staff'
      }
    });
  });

  it('should not update staff status if staff member is already active', async () => {
    
    const mockUser = {
      _id: 'user123',
      email: 'staff@example.com',
      role: 'staff',
      isActive: true,
      firstName: 'John',
      lastName: 'Doe',
      lastLogin: null,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    
    const mockStaff = {
      _id: 'staff123',
      email: 'staff@example.com',
      status: 'active',
      lastLogin: null,
      save: jest.fn().mockResolvedValue(true)
    };

    
    const mockToken = 'mock-jwt-token';
    jwt.sign.mockReturnValue(mockToken);

    
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);

    
    await loginStaff(mockReq, mockRes);

    
    expect(mockStaff.status).toBe('active');
    expect(mockStaff.save).not.toHaveBeenCalled();

    
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token: mockToken,
      user: {
        id: 'user123',
        email: 'staff@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'staff'
      }
    });
  });

  it('should not update staff status for customer role', async () => {
    
    const mockUser = {
      _id: 'user123',
      email: 'customer@example.com',
      role: 'customer',
      isActive: true,
      firstName: 'Jane',
      lastName: 'Smith',
      lastLogin: null,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    
    const mockToken = 'mock-jwt-token';
    jwt.sign.mockReturnValue(mockToken);

    
    User.findOne.mockResolvedValue(mockUser);

    
    await loginStaff(mockReq, mockRes);

    
    expect(Staff.findOne).not.toHaveBeenCalled();

    
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token: mockToken,
      user: {
        id: 'user123',
        email: 'customer@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer'
      }
    });
  });

  it('should handle staff update errors gracefully without failing login', async () => {
    
    const mockUser = {
      _id: 'user123',
      email: 'staff@example.com',
      role: 'staff',
      isActive: true,
      firstName: 'John',
      lastName: 'Doe',
      lastLogin: null,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    
    const mockToken = 'mock-jwt-token';
    jwt.sign.mockReturnValue(mockToken);

    
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockRejectedValue(new Error('Database error'));

    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    
    await loginStaff(mockReq, mockRes);

    
    expect(consoleSpy).toHaveBeenCalledWith('Error updating staff status:', expect.any(Error));

    
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token: mockToken,
      user: {
        id: 'user123',
        email: 'staff@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'staff'
      }
    });

    
    consoleSpy.mockRestore();
  });
});

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Staff = require('../../src/models/Staff');


jest.mock('../../src/models/User');
jest.mock('../../src/models/Staff');

describe('Staff Login Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update staff status to active on successful login', async () => {
    
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

    
    User.findOne.mockResolvedValue(mockUser);
    Staff.findOne.mockResolvedValue(mockStaff);

    
    const response = await request(app)
      .post('/api/auth/login/staff')
      .send({
        email: 'staff@example.com',
        password: 'password123'
      });

    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.role).toBe('staff');

    
    expect(mockStaff.status).toBe('active');
    expect(mockStaff.save).toHaveBeenCalled();
  });
});

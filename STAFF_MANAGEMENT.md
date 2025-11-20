# Staff Management System

## Overview
The staff management system allows administrators to add new staff members, send them automated email invitations with temporary passwords, and manage their accounts.

## Features

### 1. Add New Staff
- Navigate to Admin Dashboard → Staff Management
- Click "Add New Staff" button
- Fill in the form:
  - First Name (required)
  - Last Name (required)
  - Email Address (required)
  - Role (Admin, Manager, Cashier, Staff)
- Click "Send Invitation"

### 2. Automated Email System
- System generates a secure temporary password
- Email is sent to the staff member with:
  - Welcome message
  - Login credentials (email + temporary password)
  - Instructions to change password on first login
  - Direct link to admin dashboard

### 3. Staff Management
- View all staff members in a table
- See staff statistics (Total, Active, Pending)
- Resend invitations for pending staff
- Edit staff information
- Deactivate staff accounts

## Email Configuration

The system is configured to use Gmail SMTP with the following credentials:
- Email: zymouneshop@gmail.com
- App Password: xals rrbt xvmh ldwf

### Email Template Features
- Professional HTML design
- Responsive layout
- Clear instructions
- Security reminders
- Branded with Feeds Store theme

## Database Schema

### Staff Model
```javascript
{
  firstName: String (required)
  lastName: String (required)
  email: String (required, unique)
  password: String (hashed)
  role: String (admin|manager|cashier|staff)
  status: String (active|inactive|pending)
  temporaryPassword: String
  passwordChangedAt: Date
  lastLogin: Date
  createdBy: ObjectId (reference to admin who created)
  isEmailVerified: Boolean
  emailVerificationToken: String
}
```

## API Endpoints

### Staff Management
- `GET /api/staff` - Get all staff members
- `POST /api/staff` - Add new staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Deactivate staff member
- `POST /api/staff/:id/resend` - Resend invitation

### Authentication Required
All staff management endpoints require admin authentication via JWT token.

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
2. **Temporary Passwords**: Secure random password generation
3. **Email Validation**: Proper email format validation
4. **Role-based Access**: Only admins can manage staff
5. **Soft Delete**: Staff accounts are deactivated, not permanently deleted

## Usage Instructions

### For Administrators:
1. Login to admin dashboard
2. Navigate to "Staff Management" section
3. Click "Add New Staff"
4. Fill in staff details
5. System automatically sends email invitation
6. Monitor staff status in the table

### For New Staff Members:
1. Check email for invitation
2. Use provided credentials to login
3. Change password on first login
4. Access appropriate dashboard based on role

## Testing

### Test Mode
If email is not configured, the system runs in test mode:
- Temporary passwords are logged to console
- Email content is displayed in terminal
- All functionality works except actual email sending

### Production Mode
When email is properly configured:
- Real emails are sent via Gmail SMTP
- Temporary passwords are not logged
- Full email functionality is available

## Troubleshooting

### Email Issues
- Verify Gmail app password is correct
- Check internet connection
- Ensure Gmail 2FA is enabled
- Check spam folder for invitations

### Database Issues
- Ensure MongoDB connection is active
- Check staff model validation
- Verify required fields are provided

### Authentication Issues
- Ensure admin is logged in
- Check JWT token validity
- Verify admin role permissions

## Future Enhancements

1. **Bulk Staff Import**: CSV/Excel file upload
2. **Advanced Permissions**: Granular role permissions
3. **Staff Onboarding**: Multi-step onboarding process
4. **Email Templates**: Customizable email templates
5. **Audit Logs**: Track all staff management actions
6. **Staff Profiles**: Detailed staff profiles with photos
7. **Department Management**: Organize staff by departments
8. **Shift Management**: Schedule and track staff shifts

## Support

For technical support or questions about the staff management system, contact the development team or refer to the main project documentation.

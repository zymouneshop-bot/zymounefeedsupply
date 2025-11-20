# Email Configuration Guide

## Gmail Setup (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Security → 2-Step Verification
3. Turn on 2-Step Verification

### Step 2: Generate App Password
1. In Google Account settings
2. Security → 2-Step Verification → App passwords
3. Select "Mail" and generate password
4. Copy the 16-character password

### Step 3: Set Environment Variables
Create a `.env` file in your project root:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
BASE_URL=https:
```

## Alternative Email Providers

### Outlook/Hotmail
```javascript

this.transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Custom SMTP
```javascript

this.transporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Testing Without Real Email

For development/testing, you can use:
1. **Ethereal Email** (fake SMTP for testing)
2. **Console logging** (check server logs for email content)
3. **Mailtrap** (email testing service)

## Quick Test Setup

1. Create `.env` file with your Gmail credentials
2. Restart the server: `npm start`
3. Add a staff member in admin dashboard
4. Check your email or server console logs

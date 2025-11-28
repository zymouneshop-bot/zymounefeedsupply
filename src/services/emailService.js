const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

class EmailService {
  constructor() {
    console.log('🔍 EmailService Constructor - Checking environment variables');
    console.log('   SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('   EMAIL_FROM exists:', !!process.env.EMAIL_FROM);
    console.log('   EMAIL_FROM value:', process.env.EMAIL_FROM);
    
    this.isConfigured = process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM;
    
    if (this.isConfigured) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('✅ SendGrid email service initialized with API key');
    } else {
      console.log('📧 SendGrid not configured - using test mode');
      console.log('   Missing: ', {
        api_key: !process.env.SENDGRID_API_KEY ? 'YES' : 'no',
        email_from: !process.env.EMAIL_FROM ? 'YES' : 'no'
      });
    }
  }

  
  static generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  
  async sendStaffInvitation(staffData, temporaryPassword) {
    console.log('📧 Email service called with temporaryPassword:', temporaryPassword);
    
    const passwordToUse = temporaryPassword || EmailService.generateTemporaryPassword();
    console.log('📧 Password to use in email:', passwordToUse);
    
    const msg = {
      to: staffData.email,
      from: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
      subject: 'Welcome to ZYMOUNE - Your Staff Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
                .password { font-family: monospace; font-size: 18px; font-weight: bold; color: #1976d2; background: white; padding: 10px; border-radius: 4px; margin: 10px 0; }
                .button { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐔🐷 Welcome to ZYMOUNE!</h1>
                    <p>Your Staff Account is Ready</p>
                </div>
                <div class="content">
                    <h2>Hello ${staffData.firstName} ${staffData.lastName}!</h2>
                    <p>Welcome to the ZYMOUNE team! Your staff account has been created and you can now access the system.</p>
                    
                    <div class="credentials">
                        <h3>🔐 Your Login Credentials:</h3>
                        <p><strong>Email:</strong> ${staffData.email}</p>
                        <p><strong>Temporary Password:</strong></p>
                        <div class="password">${passwordToUse}</div>
                        <p><strong>Role:</strong> ${staffData.role.charAt(0).toUpperCase() + staffData.role.slice(1)}</p>
                    </div>
                    
                    <h3>🚀 Getting Started:</h3>
                    <ol>
                        <li>Go to the admin dashboard: <a href="https://zymounefeedsupply.store/">Admin Dashboard</a></li>
                        <li>Use your email and the temporary password above</li>
                        <li>Change your password on first login</li>
                        <li>Start managing the store!</li>
                    </ol>
                    
                    <p><strong>Important:</strong> Please change your password immediately after your first login for security reasons.</p>
                    
                    <div style="text-align: center;">
                        <a href="https://zymounefeedsupply.store/" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Admin Dashboard</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated message from ZYMOUNE Management System.</p>
                    <p>If you have any questions, please contact your manager.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    try {
      if (this.isConfigured) {
        await sgMail.send(msg);
        console.log(`✅ Staff invitation sent to ${staffData.email}`);
        return { success: true, temporaryPassword: passwordToUse };
      } else {
        
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL TEST MODE - Staff Invitation');
        console.log('='.repeat(60));
        console.log(`To: ${staffData.email}`);
        console.log(`Subject: ${msg.subject}`);
        console.log(`Temporary Password: ${passwordToUse}`);
        console.log('='.repeat(60));
        console.log('📝 Email content would be sent in production');
        console.log('💡 Configure SENDGRID_API_KEY to send real emails');
        console.log('='.repeat(60) + '\n');
        return { success: true, temporaryPassword: passwordToUse, testMode: true };
      }
    } catch (error) {
      console.error('❌ Error sending staff invitation:', error.message);
      return { success: false, error: error.message };
    }
  }

  
  async sendPasswordReset(email, resetToken) {
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
      subject: 'ZYMOUNE - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your ZYMOUNE account.</p>
                    <p>Click the button below to reset your password:</p>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.BASE_URL || 'http://localhost:4000'}/reset-password?token=${resetToken}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </div>
                    
                    <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
                </div>
                <div class="footer">
                    <p>If you didn't request this reset, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Password reset email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Generic email sending method
  async sendEmail({ to, subject, html }) {
    const msg = {
      to: to,
      from: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
      subject: subject,
      html: html
    };

    try {
      if (this.isConfigured) {
        console.log('📧 Attempting to send email via SendGrid...');
        console.log(`📧 To: ${to}, From: ${msg.from}`);
        console.log(`📧 Subject: ${subject}`);
        const response = await sgMail.send(msg);
        console.log(`✅ Email sent successfully! Response status: ${response[0].statusCode}`);
        return { success: true };
      } else {
        // Test mode - log email details
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL TEST MODE - Generic Email');
        console.log('='.repeat(60));
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('='.repeat(60));
        console.log('📝 Email content would be sent in production');
        console.log('💡 Configure SENDGRID_API_KEY to send real emails');
        console.log('='.repeat(60) + '\n');
        return { success: true, testMode: true };
      }
    } catch (error) {
      console.error('❌ Email error:', error.message);
      console.error('❌ Full error details:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address provided';
      } else if (error.message.includes('Invalid API Key')) {
        errorMessage = 'SendGrid API key is invalid - check SENDGRID_API_KEY configuration';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many emails sent - rate limited by SendGrid';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }
}

module.exports = EmailService;

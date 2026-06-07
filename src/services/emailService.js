const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    this.isConfigured = !!process.env.EMAIL_APP_PASSWORD;

    if (this.isConfigured) {
      console.log('✅ Nodemailer Gmail email service initialized');
    } else {
      console.log('📧 Email not configured - using test mode');
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
    const passwordToUse = temporaryPassword || EmailService.generateTemporaryPassword();

    const msg = {
      from: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
      to: staffData.email,
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
                    <p><strong>Important:</strong> Please change your password immediately after your first login for security reasons.</p>
                    <div style="text-align: center;">
                        <a href="https://zymounefeedsupply.store/" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">LOG IN HERE</a>
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
        await this.transporter.sendMail(msg);
        console.log(`✅ Staff invitation sent to ${staffData.email}`);
        return { success: true, temporaryPassword: passwordToUse };
      } else {
        console.log('📧 TEST MODE - Staff Invitation');
        console.log(`To: ${staffData.email}, Temporary Password: ${passwordToUse}`);
        return { success: true, temporaryPassword: passwordToUse, testMode: true };
      }
    } catch (error) {
      console.error('❌ Error sending staff invitation:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordReset(email, resetToken) {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || 'http://localhost:4000';

    const msg = {
      from: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
      to: email,
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
                <a href="${baseUrl}/reset-password?token=${resetToken}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
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
      if (this.isConfigured) {
        await this.transporter.sendMail(msg);
        console.log(`✅ Password reset email sent to ${email}`);
        return { success: true };
      } else {
        console.log('📧 TEST MODE - Password Reset');
        console.log(`To: ${email}, Reset Token: ${resetToken}`);
        return { success: true, testMode: true };
      }
    } catch (error) {
      console.error('❌ Error sending password reset email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEmail({ to, subject, html }) {
    const msg = {
      from: process.env.EMAIL_FROM || 'zymouneshop@gmail.com',
      to,
      subject,
      html
    };

    try {
      if (this.isConfigured) {
        await this.transporter.sendMail(msg);
        console.log(`✅ Email sent to ${to}`);
        return { success: true };
      } else {
        console.log('📧 TEST MODE - Generic Email');
        console.log(`To: ${to}, Subject: ${subject}`);
        return { success: true, testMode: true };
      }
    } catch (error) {
      console.error('❌ Email error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;

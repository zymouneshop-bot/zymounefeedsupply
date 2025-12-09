const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  lowStockRecipientEmail: {
    type: String,
    required: true,
    default: 'personincharge@example.com'
  }
}, { timestamps: true });

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

module.exports = NotificationSettings;

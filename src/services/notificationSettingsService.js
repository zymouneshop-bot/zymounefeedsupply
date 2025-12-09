const NotificationSettings = require('../models/NotificationSettings');

// Returns the current low stock recipient email, or creates a default if not found
async function getLowStockRecipientEmailDB() {
  let settings = await NotificationSettings.findOne();
  if (!settings) {
    settings = await NotificationSettings.create({});
  }
  return settings.lowStockRecipientEmail;
}

// Updates the low stock recipient email in the DB
async function setLowStockRecipientEmailDB(email) {
  let settings = await NotificationSettings.findOne();
  if (!settings) {
    settings = new NotificationSettings();
  }
  settings.lowStockRecipientEmail = email;
  await settings.save();
  return settings.lowStockRecipientEmail;
}

module.exports = {
  getLowStockRecipientEmailDB,
  setLowStockRecipientEmailDB
};

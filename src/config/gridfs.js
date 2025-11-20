const mongoose = require('mongoose');

// Initialize GridFS
const initGridFS = () => {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ GridFS ready for native MongoDB operations');
  } else {
    console.log('⚠️ MongoDB not connected, GridFS not initialized');
  }
};

// Initialize when connection is ready
mongoose.connection.once('open', initGridFS);

// Also try to initialize if already connected
if (mongoose.connection.readyState === 1) {
  initGridFS();
}

module.exports = {
  initGridFS,
  getGFSStorage: () => null // We'll handle uploads manually
};

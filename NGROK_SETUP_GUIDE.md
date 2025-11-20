# Ngrok Setup Guide for ZYMOUNE Feeds Application

## ✅ **Issue Fixed: Dynamic API URLs**

The application now automatically detects whether it's running on localhost or ngrok and adjusts API calls accordingly.

## 🚀 **How to Use with Ngrok:**

### 1. **Start Your Application:**
```bash
npm start
```

### 2. **Start Ngrok (in a new terminal):**
```bash
npx ngrok http 4000
```

### 3. **Access from Any Device:**
- Use the ngrok URL (e.g., `https://abc123.ngrok.io`) on any device
- The application will automatically use the correct API endpoints

## 🔧 **What Was Fixed:**

### **Before (Hardcoded):**
```javascript
const API_BASE = 'http://localhost:4000/api';
```

### **After (Dynamic):**
```javascript
const API_BASE = `${window.location.protocol}//${window.location.host}/api`;
```

## 📱 **Testing QR Scanning:**

1. **Open staff dashboard** on your computer using ngrok URL
2. **Open QR scanner** on your phone using the same ngrok URL
3. **Scan a product QR code** - the purchase modal should appear in the staff dashboard

## 🔍 **Troubleshooting:**

### **If QR scanning still doesn't work:**

1. **Test the communication manually:**
   - Click the "🧪 Test QR Modal" button in the staff dashboard
   - This will trigger a test modal to verify the system works

2. **Check browser console:**
   - Open browser developer tools (F12)
   - Look for any error messages
   - Check if the QR communication is being triggered

3. **Verify ngrok is working:**
   - Make sure both devices can access the ngrok URL
   - Test that the staff dashboard loads properly on both devices

## 🌐 **Supported Domains:**

The application now works with:
- ✅ `http://localhost:4000` (local development)
- ✅ `https://abc123.ngrok.io` (ngrok tunnels)
- ✅ `https://abc123.ngrok-free.app` (new ngrok domains)
- ✅ Any other domain you deploy to

## 🎯 **Next Steps:**

1. **Test the login** from your phone using the ngrok URL
2. **Test QR scanning** between your phone and computer
3. **Verify all features work** across devices

The dynamic API URL system ensures your application works seamlessly whether accessed locally or through ngrok!

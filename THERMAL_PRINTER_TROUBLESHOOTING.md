# Thermal Printer Troubleshooting Guide

## 🔧 **Common Issues & Solutions**

### **Issue 1: Print Dialog Not Appearing**
**Symptoms:** No print dialog opens when completing checkout
**Solutions:**
1. **Check Browser Popup Blocker:**
   - Allow popups for your site
   - Check browser settings for blocked popups
   
2. **Browser Compatibility:**
   - Try Chrome, Firefox, or Edge
   - Disable ad blockers temporarily
   
3. **Check Console Errors:**
   - Press F12 to open developer tools
   - Look for JavaScript errors in Console tab

### **Issue 2: Print Dialog Opens But Nothing Prints**
**Symptoms:** Print dialog appears but thermal printer doesn't print
**Solutions:**
1. **Printer Selection:**
   - Ensure thermal printer is selected as default printer
   - Check Windows/Mac printer settings
   
2. **Printer Connection:**
   - Verify USB connection to thermal printer
   - Check if printer is powered on
   - Test printer with other applications (Notepad, Word)
   
3. **Printer Settings:**
   - Set paper size to 57mm (2.25 inches)
   - Check printer driver installation
   - Update printer drivers if needed

### **Issue 3: Receipt Format Issues**
**Symptoms:** Receipt prints but formatting is wrong
**Solutions:**
1. **Paper Size Settings:**
   - Set custom paper size: 57mm width
   - Set margins to 0
   - Disable headers/footers
   
2. **Print Quality:**
   - Check thermal paper quality
   - Clean printer head if needed
   - Adjust print density settings

### **Issue 4: JavaScript Errors**
**Symptoms:** Console shows errors during printing
**Solutions:**
1. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for red error messages
   - Take screenshot of errors
   
2. **Common Errors:**
   - "printWindow is not defined" → Browser security issue
   - "Permission denied" → Popup blocker
   - "Cannot read property" → Data formatting issue

## 🧪 **Testing Steps**

### **Step 1: Test Print Function**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Type: `testPrint()` and press Enter
4. Check if print dialog appears

### **Step 2: Test Thermal Printer**
1. Open Notepad or any text editor
2. Type some text
3. Press Ctrl+P to print
4. Select your thermal printer
5. If this works, printer is fine

### **Step 3: Test Browser Print**
1. Go to any website
2. Press Ctrl+P
3. Check if print dialog works
4. If not, browser issue

## 🔧 **Quick Fixes**

### **Fix 1: Enable Popups**
```javascript
// Add this to browser console if popups are blocked
window.open('about:blank', '_blank');
```

### **Fix 2: Manual Print Test**
1. Complete a test purchase
2. When print window opens, manually press Ctrl+P
3. Select thermal printer
4. Print

### **Fix 3: Alternative Print Method**
If automatic printing fails:
1. The receipt window should still open
2. Manually press Ctrl+P in that window
3. Select your thermal printer
4. Print

## 🖨️ **Thermal Printer Setup**

### **For 57mm Thermal Printers:**
1. **Paper Size:** 57mm (2.25 inches) width
2. **Paper Type:** Thermal paper
3. **Connection:** USB (preferred) or Bluetooth
4. **Driver:** Install manufacturer's driver

### **Recommended Settings:**
- **Paper Size:** Custom 57mm x 200mm
- **Margins:** 0mm all sides
- **Orientation:** Portrait
- **Quality:** Draft (fastest)

## 🚨 **Emergency Solutions**

### **If Nothing Works:**
1. **Manual Receipt:**
   - Copy receipt content from print window
   - Paste into Word/Notepad
   - Print manually
   
2. **Alternative Receipt:**
   - Take screenshot of receipt
   - Print screenshot
   
3. **Contact Support:**
   - Note browser version
   - Note printer model
   - Include console error messages

## 📱 **Mobile/Tablet Issues**

### **Mobile Browsers:**
- Some mobile browsers don't support printing
- Use desktop browser if possible
- Try Chrome mobile browser

### **Tablet Solutions:**
- Use Chrome or Firefox
- Enable desktop mode
- Connect thermal printer via USB hub

## 🔍 **Debug Information**

### **Check These Settings:**
1. **Browser:** Version and type
2. **Operating System:** Windows/Mac/Linux version
3. **Printer Model:** Make and model
4. **Connection Type:** USB/Bluetooth/Network
5. **Printer Driver:** Version and installation status

### **Console Commands for Testing:**
```javascript
// Test if print function exists
typeof printReceipt

// Test print with sample data
testPrint()

// Check browser popup support
window.open('about:blank', '_blank', 'width=100,height=100')
```

## 📞 **Still Having Issues?**

If none of these solutions work:
1. **Check printer with other software** (Word, Notepad)
2. **Try different browser** (Chrome, Firefox, Edge)
3. **Update browser** to latest version
4. **Restart computer** and try again
5. **Check thermal paper** is loaded correctly

Remember: The system creates a print window that should automatically trigger printing. If the window opens but doesn't print, it's usually a printer or browser setting issue.

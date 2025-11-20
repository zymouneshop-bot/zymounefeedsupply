# SM8070 Scanner Troubleshooting Guide

## 🔧 **Debugging Steps:**

### **1. Test the System:**
1. **Click "🔧 Test Scanner" button** - This simulates scanner input
2. **Check browser console** (F12) for debug messages
3. **Verify the purchase modal opens**

### **2. Test Your SM8070 Scanner:**
1. **Open Notepad** on your computer
2. **Point your SM8070 scanner** at a QR code
3. **Scan the QR code** - you should see the product ID appear in Notepad
4. **If nothing appears** - check scanner connection and settings

### **3. Check Scanner Settings:**
- **USB Connection**: Ensure scanner is connected via USB
- **Keyboard Mode**: Scanner should be in "keyboard wedge" mode
- **Data Format**: Scanner should send data + Enter key

### **4. Debug Console Messages:**
When you scan, you should see these messages in the browser console:
```
🔧 Setting up SM8070 scanner support...
🔧 Input element found: true
🔧 Input event triggered, value: [product_id]
🔧 Rapid input detected, buffer: [product_id]
🔧 Scanner input detected: [product_id]
🔧 Processing scanner input: [product_id]
🔧 Auto-triggering scan for scanner input
🔧 SM8070 scanner input: [product_id]
```

## 🚨 **Common Issues:**

### **Issue 1: Scanner Not Detected**
**Symptoms:** No console messages when scanning
**Solution:** 
- Check USB connection
- Test scanner in Notepad first
- Ensure scanner is in keyboard mode

### **Issue 2: Input Detected But Modal Doesn't Open**
**Symptoms:** Console shows input but no modal
**Solution:**
- Check if products are loaded
- Verify product ID exists in database
- Check for JavaScript errors

### **Issue 3: Scanner Sends Wrong Data**
**Symptoms:** Scanner inputs something other than product ID
**Solution:**
- Check QR code content
- Verify QR code contains simple product ID
- Regenerate QR codes if needed

## 🧪 **Testing Steps:**

### **Step 1: Test Button**
1. Click "🔧 Test Scanner" button
2. Purchase modal should open
3. If it works, the system is fine

### **Step 2: Test Manual Input**
1. Type a product ID manually
2. Press Enter or click Scan
3. Purchase modal should open

### **Step 3: Test Scanner**
1. Point scanner at QR code
2. Scan the QR code
3. Check console for debug messages
4. Purchase modal should open automatically

## 🔍 **Debug Information:**

### **What to Check:**
1. **Browser Console** (F12) - Look for 🔧 messages
2. **Scanner Input** - Does data appear in the text field?
3. **Product Loading** - Are products loaded in the system?
4. **QR Code Content** - Does QR code contain product ID?

### **Expected Behavior:**
1. **Scan QR code** → Product ID appears in text field
2. **Auto-trigger** → System automatically processes the scan
3. **Modal opens** → Purchase modal appears
4. **Success notification** → "Product scanned! Purchase modal opened..."

## 🎯 **Quick Fixes:**

### **If Scanner Works in Notepad but Not in Browser:**
- Check if the input field has focus
- Try clicking on the input field before scanning
- Check for JavaScript errors

### **If Modal Doesn't Open:**
- Check console for error messages
- Verify product exists in database
- Try manual input to test the system

### **If Nothing Happens:**
- Check scanner connection
- Test scanner in Notepad
- Verify scanner is in keyboard mode
- Check browser console for errors

The debug messages will help identify exactly where the issue is occurring!

# SM8070 Scanner Setup Guide

## Overview
Your SM8070 barcode scanner can now be used directly with the ZYMOUNE feeds application instead of using a phone for QR code scanning. The scanner works in "keyboard wedge" mode, meaning it acts like a keyboard input device.

## Setup Instructions

### 1. Hardware Setup
1. **Connect the SM8070 scanner** to your computer via USB
2. **Install drivers** if required (check manufacturer's website)
3. **Test the scanner** by opening a text editor and scanning a barcode - you should see the scanned data appear as if typed

### 2. Scanner Configuration
The SM8070 scanner should be configured to work in "keyboard wedge" mode:
- **Data format**: The scanner should send the scanned data followed by an Enter key
- **No special configuration needed** - it should work out of the box
- **Test mode**: Open Notepad and scan a barcode to verify it's working

### 3. Application Usage

#### In Staff Dashboard:
1. **Open the staff dashboard** in your web browser
2. **Click on the QR input field** (it should have focus automatically)
3. **Point the SM8070 scanner** at any QR code on a product
4. **Scan the QR code** - the scanner will automatically input the data
5. **The product modal will appear** automatically after scanning

#### In Admin Dashboard:
1. **Open the admin dashboard** in your web browser
2. **Use the QR scanner page** (`/qr-scanner.html`) for scanning
3. **Point the SM8070 scanner** at any QR code
4. **The purchase modal will trigger** automatically

## How It Works

### Technical Implementation:
- **Keyboard Input Detection**: The application detects rapid input from the scanner
- **Auto-trigger**: When scanner input is detected, the scan function is automatically triggered
- **Multiple Input Methods**: Supports SM8070 scanner, phone camera, and manual input
- **Real-time Processing**: Scanned data is processed immediately

### Scanner Input Detection:
- **Rapid Input Detection**: Monitors for fast typing patterns typical of barcode scanners
- **Timeout Handling**: Waits for scanner to finish before processing
- **Buffer Management**: Handles multiple rapid inputs correctly

## Troubleshooting

### Scanner Not Working:
1. **Check USB connection** - ensure scanner is properly connected
2. **Test in Notepad** - scan a barcode in a text editor to verify scanner works
3. **Check focus** - ensure the QR input field has focus
4. **Browser compatibility** - try different browsers if issues persist

### Scanner Input Not Detected:
1. **Clear the input field** and try again
2. **Click on the input field** to ensure it has focus
3. **Check scanner settings** - ensure it's in keyboard wedge mode
4. **Try manual input** to verify the application is working

### Performance Issues:
1. **Close unnecessary browser tabs** to free up resources
2. **Check internet connection** for server communication
3. **Restart the application** if scanning becomes unresponsive

## Benefits of Using SM8070 Scanner

### Advantages over Phone Scanning:
- **Faster scanning** - no need to open camera app
- **More reliable** - dedicated hardware vs. phone camera
- **Better accuracy** - designed specifically for barcode scanning
- **No battery drain** - doesn't use phone battery
- **Professional setup** - more suitable for business use

### Workflow Improvements:
- **One-handed operation** - hold scanner in one hand, operate with other
- **Faster checkout** - immediate scanning without phone setup
- **Better for staff** - easier training and operation
- **Consistent performance** - same experience every time

## Support

If you encounter any issues with the SM8070 scanner integration:
1. **Check this guide** for troubleshooting steps
2. **Test scanner in Notepad** to verify hardware functionality
3. **Check browser console** for any error messages
4. **Contact support** with specific error details if problems persist

## Future Enhancements

The scanner integration is designed to be extensible:
- **Multiple scanner support** - can add more scanner types
- **Custom data formats** - can handle different barcode formats
- **Advanced filtering** - can add data validation and formatting
- **Audit logging** - can track scanner usage for analytics

---

**Note**: The SM8070 scanner integration works alongside the existing phone scanning functionality, so you can use either method as needed.

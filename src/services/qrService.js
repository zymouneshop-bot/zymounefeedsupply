const QRCode = require('qrcode');

class QRService {
  
  static async generateProductQR(product) {
    try {
      // Simple product ID for SM8070 scanner
      const productId = product.id || product._id;
      
      // Generate QR code with just the product ID
      const qrCodeDataURL = await QRCode.toDataURL(productId, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrCode: qrCodeDataURL,
        productId: productId,
        productName: product.name
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Simple QR code generation - no complex URLs needed for SM8070 scanner

  
  static parseQRData(qrString) {
    try {
      return JSON.parse(qrString);
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }
}

module.exports = QRService;

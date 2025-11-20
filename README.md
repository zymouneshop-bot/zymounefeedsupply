# Feeds Store - Chicken & Pig Feed Sales System

A comprehensive e-commerce system for selling chicken feeds, pig feeds, and supplements with separate customer and admin dashboards.

## Features

- 🐔 **Chicken Feeds**: Starter, Grower, and Layer feeds
- 🐷 **Pig Feeds**: Starter, Grower, and Finisher feeds
- 💊 **Supplements**: Vitamins and Minerals
- 👥 **Dual User System**: Customer and Admin dashboards
- 🛒 **E-commerce**: Shopping cart, orders, payments
- 📊 **Analytics**: Sales reports and customer insights

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the example environment file and configure it:
```bash
copy config.example.env .env
```
Then edit `.env` with your actual configuration values.

### 3. Run the Application

**Development Mode (with auto-restart):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

### 4. Access the Application
- **API**: http:
- **Health Check**: http:
- **Customer API**: http:
- **Admin API**: http:
- **Products API**: http:

## Project Structure

```
src/
├── auth/                 # Authentication logic
├── controllers/          # Request handlers
├── dashboards/          # Customer & Admin dashboards
├── middleware/          # Custom middleware
├── products/            # Product categories
├── users/               # User management
├── orders/              # Order processing
├── payments/            # Payment handling
└── app.js              # Main application file
```

## API Endpoints

- `GET /` - Welcome message and API info
- `GET /api/health` - Health check
- `GET /api/customer` - Customer endpoints
- `GET /api/admin` - Admin endpoints
- `GET /api/products` - Product endpoints
- `GET /api/auth` - Authentication endpoints

## Development

### Available Scripts
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-restart)
- `npm test` - Run tests
- `npm run build` - Build the project

### Prerequisites
- Node.js 16+ 
- npm or yarn
- MongoDB (for database)

## License

MIT License

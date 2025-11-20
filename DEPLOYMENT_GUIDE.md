# Deployment Guide: Render + Netlify

This guide will help you deploy your Feeds Store application online for free using Render (backend) and Netlify (frontend).

---

## Prerequisites

- GitHub account
- Render account (render.com)
- Netlify account (netlify.com)
- MongoDB Atlas account (already set up based on your config)

---

## Part 1: Prepare Your Code for Deployment

### 1.1 Update Your app.js for Production

Your app.js needs to serve the static frontend files. Update your app.js to include:

```javascript
// Add this near the top of app.js (after all middleware setup)
// Serve static files from the public directory
app.use(express.static('public'));

// At the BOTTOM of app.js, add this catch-all route (AFTER all API routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

### 1.2 Create a .gitignore file

Create a file named `.gitignore` in your project root:

```
node_modules/
.env
.DS_Store
*.log
dist/
build/
```

### 1.3 Update Environment Variables

1. Keep your `.env` file secure (don't commit to GitHub)
2. Use `.env.example` for reference (you already have `config.example.env`)

---

## Part 2: Deploy Backend to Render

### 2.1 Push Your Code to GitHub

1. Initialize git (if not done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a GitHub repository at github.com/new

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/feeds-store.git
   git branch -M main
   git push -u origin main
   ```

### 2.2 Create Render Account and Deploy

1. Go to **render.com** and sign up (use GitHub)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in the settings:
   - **Name**: `feeds-store-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `18` (or higher)

5. Click **"Advanced"** and add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.zlha3qw.mongodb.net/feeds_store?retryWrites=true&w=majority&appName=Cluster0
   
   JWT_SECRET=your-very-secure-random-string-change-this
   
   JWT_EXPIRES_IN=24h
   
   NODE_ENV=production
   
   PORT=4000
   
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

6. Click **"Create Web Service"**

7. Wait for deployment to complete
   - Your backend URL will be: `https://feeds-store-api.onrender.com`
   - Save this URL

⚠️ **Note**: Free tier on Render spins down after 15 minutes of inactivity. Upgrade to paid if you want always-on service.

---

## Part 3: Prepare Frontend for Netlify

### 3.1 Update API Endpoints in Your HTML Files

You need to replace all `localhost:4000` or `http://localhost:3000` references with your Render backend URL.

Search for these in your HTML files:
- `admin-dashboard.html`
- `staff-dashboard.html`
- `login.html`
- `qr-scanner.html`

Replace:
```javascript
// OLD (development)
const API_URL = 'http://localhost:4000';

// NEW (production)
const API_URL = 'https://feeds-store-api.onrender.com';
```

OR better - use a dynamic approach:

```javascript
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://feeds-store-api.onrender.com';
```

### 3.2 Create a netlify.toml file

Create `netlify.toml` in your project root:

```toml
[build]
  command = "echo 'No build required'"
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  port = 8000
```

### 3.3 Create a Build Script (Optional)

If you want Netlify to build your project, update your `package.json`:

```json
"scripts": {
  "build": "echo 'Build complete'",
  "start": "node src/app.js"
}
```

---

## Part 4: Deploy Frontend to Netlify

### 4.1 Connect GitHub to Netlify

1. Go to **netlify.com** and sign up (use GitHub)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Select your `feeds-store` repository

### 4.2 Configure Build Settings

1. **Build command**: Leave empty (or `npm run build`)
2. **Publish directory**: `public`
3. Click **"Deploy site"**

### 4.3 Add Environment Variables (if needed)

In Netlify Site Settings → Build & Deploy → Environment:
- You can add any variables needed on the frontend

### 4.4 Get Your Netlify URL

Your frontend will be deployed at: `https://your-site-name.netlify.app`

---

## Part 5: Testing

### 5.1 Test Backend

Open: `https://feeds-store-api.onrender.com/api/health` (or your health endpoint)

### 5.2 Test Frontend

Open: `https://your-site-name.netlify.app`

### 5.3 Test API Calls

1. Open browser DevTools (F12)
2. Check Network tab when making API calls
3. Verify requests go to your Render backend
4. Check Console for any CORS errors

---

## Common Issues & Solutions

### Issue 1: CORS Errors

**Solution**: Update your app.js CORS configuration:

```javascript
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:4000',
        'https://your-site-name.netlify.app',
        'https://feeds-store-api.onrender.com'
    ],
    credentials: true
}));
```

### Issue 2: Images Not Loading

**Solution**: Ensure your MongoDB GridFS is properly configured and update image URLs to use your backend URL:

```javascript
// In your API responses
const imageUrl = `${process.env.BACKEND_URL}/api/images/${imageId}`;
```

### Issue 3: Render App Goes to Sleep

**Solution**: 
- Upgrade to Paid tier for always-on
- OR use a ping service to keep it awake
- OR accept the cold start delay

### Issue 4: "Cannot find module" errors

**Solution**: 
- Ensure `package-lock.json` is in your repo
- Render will run `npm install` during deployment

---

## Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Render backend deployed and URL obtained
- [ ] Netlify frontend deployed and URL obtained
- [ ] API endpoints updated in HTML files
- [ ] Environment variables set in Render
- [ ] CORS configured properly
- [ ] Frontend can make API calls to backend
- [ ] Login works end-to-end
- [ ] Product display works
- [ ] Orders can be placed

---

## Next Steps

1. Test all features thoroughly
2. Monitor Render/Netlify logs for errors
3. Set up error tracking (Sentry, etc.)
4. Consider upgrading to paid tiers if traffic grows
5. Set up CI/CD for automatic deployments

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **MongoDB Atlas Docs**: https://docs.mongodb.com/atlas

---

**Need Help?** Check the deployment logs:
- Render: Dashboard → Your App → Logs
- Netlify: Site Settings → Build & Deploy → Deploy Log

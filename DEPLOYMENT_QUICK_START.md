# Quick Deployment Setup Commands

## Step 1: Initialize Git Repository

```bash
cd c:\Users\trina\feeds

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Ready for deployment"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a repository named `feeds-store`
3. Do NOT initialize with README (we already have one)

## Step 3: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/feeds-store.git

# Rename branch to main
git branch -M main

# Push code
git push -u origin main
```

## Step 4: Environment Variables for Render

Copy and save these - you'll need them when creating the Render service:

```
MONGODB_URI=mongodb+srv://trinavaldezmalit4_db_user:feedsupply@cluster0.zlha3qw.mongodb.net/feeds_store?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=feeds-store-super-secret-key-2024

JWT_EXPIRES_IN=24h

NODE_ENV=production

PORT=4000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=zymouneshop@gmail.com
EMAIL_PASS=xals rrbt xvmh ldwf
```

## Step 5: After Backend Deployment on Render

Once Render deploys your backend, you'll get a URL like:
`https://feeds-store-api.onrender.com`

## Step 6: Update Frontend API Endpoints

Add this to the TOP of your HTML files (in <script> tags):

```javascript
// Detect environment and set API URL
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:4000' 
    : 'https://feeds-store-api.onrender.com';

console.log('Using API URL:', API_URL);
```

Then replace all your API calls from:
```javascript
fetch('http://localhost:4000/api/...')
```

To:
```javascript
fetch(API_URL + '/api/...')
```

## Quick Search & Replace in VS Code

1. Press `Ctrl+H` to open Find & Replace
2. Find: `http://localhost:4000`
3. Replace with: `${API_URL}`
4. Replace all in all files

## Step 7: Create .gitignore

Create a file named `.gitignore` in project root:

```
node_modules/
.env
.DS_Store
*.log
uploads/
dist/
build/
*.swp
*.swo
*~
.vscode/
.idea/
```

## Step 8: Deploy on Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Fill in:
   - Name: `feeds-store-api`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add Environment Variables (from Step 4)
7. Click "Create Web Service"
8. Wait 5-10 minutes for deployment

## Step 9: Deploy on Netlify

1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import existing project"
4. Select `feeds-store` repo
5. Set:
   - Build command: (leave empty)
   - Publish directory: `public`
6. Click "Deploy site"
7. Wait for deployment

## Step 10: Verify Deployment

Test these URLs:
- Backend: `https://your-backend.onrender.com`
- Frontend: `https://your-site.netlify.app`

Open frontend and:
1. Try logging in
2. Check browser console (F12) for any errors
3. Check if API calls go to your backend URL

---

## Troubleshooting

**Backend not deploying?**
- Check Render logs
- Verify MongoDB URI is correct
- Ensure all environment variables are set

**Frontend not loading?**
- Check browser console for 404 errors
- Verify API_URL is set correctly
- Check if public folder exists

**CORS errors?**
- Add your Netlify URL to CORS whitelist in app.js
- Restart Render deployment

---

## Your Deployment URLs (once deployed)

- Backend: `https://feeds-store-api.onrender.com`
- Frontend: `https://your-custom-name.netlify.app`

🎉 You're now live on the internet!

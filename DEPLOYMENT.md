# Deployment Guide

## Deploy to Render

This app is configured for easy deployment on Render with PostgreSQL.

### Option 1: One-Click Deploy (Recommended)

1. **Fork this repository** to your GitHub account

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account and select your forked repository

3. **Configure the deployment:**
   - **Name**: `mealplanner-pro` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `NODE_ENV=production node dist/index.js`

4. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: (will be auto-configured when you add PostgreSQL)

5. **Add PostgreSQL Database:**
   - In your service dashboard, go to "Environment" tab
   - Click "Add Database" → "PostgreSQL"
   - This will automatically set up `DATABASE_URL`

6. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Your app will be available at `https://your-app-name.onrender.com`

### Option 2: Manual Setup

If you prefer manual configuration:

1. **Create PostgreSQL Database:**
   - In Render dashboard: New + → PostgreSQL
   - Note the connection string

2. **Create Web Service:**
   - New + → Web Service
   - Connect your GitHub repo
   - Use the build/start commands above
   - Add the DATABASE_URL environment variable

### Environment Variables Required

- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Render)

### Troubleshooting

**If you get "missing script start" error:**
- Use `NODE_ENV=production node dist/index.js` as the start command instead of `npm start`
- This bypasses any npm script caching issues in Render

**If you encounter "Cannot find module" errors:**
1. Check build logs to verify `npm run build` completed successfully
2. Ensure `dist/index.js` was created in the build output  
3. Make sure PostgreSQL database is connected before starting the web service
4. Try using the direct start command: `NODE_ENV=production node dist/index.js`

**Alternative Start Commands:**
- **Primary**: `NODE_ENV=production node dist/index.js` (recommended for Render)
- **Fallback**: `npm start` (if npm scripts work properly)
- **Debug**: Add `ls -la dist/` to build command to verify files are created

### Database Migration

The app automatically creates tables and seeds initial data on first run. No manual migration needed.

### Custom Domain (Optional)

After deployment, you can add a custom domain in the Render dashboard under "Settings" → "Custom Domains".

## Alternative: Deploy to Railway/Vercel

The app is also compatible with:
- **Railway**: Similar setup, add PostgreSQL addon
- **Vercel**: Requires Vercel Postgres addon
- **Heroku**: Add Heroku Postgres addon

For these platforms, use the same environment variables and build commands.
# Production Deployment Checklist for MrGuru.dev Portfolio

This checklist ensures your portfolio is ready for production deployment on Vercel.

## Pre-Deployment Checks

### 1. Environment Variables
- [ ] `GITHUB_TOKEN` - Valid GitHub personal access token with repo and user scopes
- [ ] `DATABASE_URL` - PostgreSQL connection string for your database
- [ ] `SESSION_SECRET` - Secret key for session encryption
- [ ] `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` - For GitHub authentication
- [ ] `FRONTEND_URL` - Set to your Vercel domain or custom domain

### 2. Database Setup
- [ ] Create a PostgreSQL database (Vercel Postgres, Neon, or Supabase)
- [ ] Run migrations to create all required tables
- [ ] Test database connection from a similar environment to Vercel

### 3. GitHub Integration
- [ ] Verify GitHub token has correct permissions
- [ ] Ensure GitHub username is correct in configuration
- [ ] Test repositories and skills data retrieval

### 4. Authentication (If enabled)
- [ ] Configure GitHub OAuth callback URLs for production
- [ ] Test login and registration flows
- [ ] Verify that protected routes work correctly

### 5. Content & Asset Check
- [ ] Ensure all project demo links work and are accessible
- [ ] Check that all images and media assets load properly
- [ ] Verify resume download functionality

## Deployment Steps

1. **Connect Repository to Vercel**
   - Connect your GitHub repository to Vercel
   - Use the "Import Git Repository" option in Vercel

2. **Configure Build Settings**
   - Build Command: `node vercel-build.js` (Already configured in vercel.json)
   - Output Directory: `dist` (Already configured in vercel.json)
   - Install Command: `npm install` (Already configured in vercel.json)

3. **Add Environment Variables**
   - Add all required environment variables in the Vercel project settings
   - Mark sensitive variables as "sensitive" in the Vercel dashboard

4. **Deploy Application**
   - Trigger deployment from Vercel dashboard
   - Monitor build logs for any issues

5. **Run Database Migrations**
   - After deployment, run migrations if they weren't part of the build process
   - Use the Vercel CLI or dashboard to execute: `npm run db:push`

## Post-Deployment Verification

- [ ] Test all pages and navigation
- [ ] Verify API endpoints work correctly
- [ ] Check GitHub skills integration
- [ ] Test contact form submission
- [ ] Verify authentication flows (if enabled)
- [ ] Test resume download functionality
- [ ] Check interactive project demos
- [ ] Ensure proper loading of all assets
- [ ] Test mobile responsiveness
- [ ] Verify immersive/standard mode toggle works

## Performance & Monitoring

- [ ] Set up Vercel Analytics
- [ ] Configure alerts for any downtime
- [ ] Set up regular database backups
- [ ] Monitor GitHub API rate limiting

## Common Issues & Solutions

**GitHub API Rate Limiting:**
- The application is designed to cache GitHub data to minimize API calls
- If you encounter rate limits, increase cache duration in `server/services/githubService.ts`

**Database Connection Issues:**
- Verify your database allows connections from Vercel's IP ranges
- Check connection string format is correct for your database provider

**Authentication Errors:**
- Verify GitHub OAuth callback URLs match your deployed domain
- Check that SESSION_SECRET is properly set in environment variables

**Deployment Failures:**
- Check Vercel build logs for detailed error messages
- Verify Node.js version compatibility
- Ensure all dependencies are properly installed
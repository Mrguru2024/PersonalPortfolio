# Vercel Static Deployment Guide for MrGuru.dev Portfolio

This guide covers how to deploy your portfolio as a static site to Vercel without using serverless functions.

## Overview of Static Deployment

This project has been configured to work as both a full-stack application (with Express backend) and as a static site deployment on Vercel. The static deployment:

1. Only includes the frontend React components
2. Uses pre-generated static JSON files instead of live API endpoints 
3. Handles SPA routing through client-side routing

## Deployment Steps

### 1. Push Your Code to GitHub

Ensure all your changes are committed and pushed to your GitHub repository.

### 2. Create a New Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your repository
4. On the configuration page:
   - Framework Preset: Leave as "Other"
   - Build Command: Will use `node vercel-build-static.js` from vercel.json
   - Output Directory: `dist` (already set in vercel.json)
   - Install Command: `npm install` (already set in vercel.json)

### 3. Environment Variables

You don't need to add database credentials or API keys for static deployment since we're not using serverless functions. The static site works with pre-generated API data.

### 4. Deploy

Click "Deploy" to start the static deployment process.

## How the Static Deployment Works

The static deployment process works as follows:

1. `vercel.json` - Configures the build process and static asset serving:
   - Uses `vercel-build-static.js` for the build command
   - Sets proper caching headers for assets
   - Configures SPA routing with the `rewrites` section

2. `vercel-build-static.js` - The custom build script that:
   - Builds only the frontend with `vite build`
   - Creates static API JSON files in `/api/` directory
   - Sets up proper SPA routing with 404.html

3. `vercel-static-api.js` - Creates JSON files with static data for:
   - Skills
   - Projects
   - Blog posts
   - Other needed API endpoints

4. `client/src/lib/queryClient.ts` - Modified to:
   - Detect when running on Vercel production
   - Use `.json` files instead of API endpoints in production
   - Fall back gracefully when endpoints don't exist

## Limitations of Static Deployment

The static deployment has some limitations:

1. No database access - all data must be pre-generated at build time
2. No dynamic API endpoints - cannot submit forms that need processing
3. No authentication - admin features won't work
4. No real-time updates - data only changes when you redeploy

## When to Use Full Deployment vs. Static Deployment

- **Static Deployment**: Use for showcasing your portfolio when you don't need dynamic features
- **Full Deployment**: Use when you need full database access, authentication, and API functionality

## Updating the Static Deployment

To update your static deployment:

1. Make your changes locally
2. Update the static data in `vercel-static-api.js` if needed
3. Commit and push to GitHub
4. Vercel will automatically redeploy

## Technical Details

### File Structure for Static Deployment

```
dist/
├── index.html      # Main SPA entry point
├── 404.html        # Copy of index.html for client-side routing
├── assets/         # Static assets
└── api/            # Static API JSON files
    ├── skills.json
    ├── projects.json
    ├── blog.json
    └── user.json
```

### Client-Side Routing

The static deployment uses client-side routing through:

1. Vercel's `rewrites` config in vercel.json
2. A custom 404.html that serves the SPA for all routes

### Static API Endpoints

The React app attempts to fetch from real API endpoints, but when deployed to Vercel static hosting, the `queryClient.ts` redirects these requests to static JSON files.
# Vercel Static Deployment Guide for MrGuru.dev Portfolio

This guide covers how to deploy your portfolio as a static site to Vercel without using serverless functions.

## Overview of Static Deployment

This project has been configured to work as both a full-stack application (with Express backend) and as a static site deployment on Vercel. The static deployment:

1. Only includes the frontend React components
2. Uses client-side localStorage for API data instead of backend endpoints
3. Handles SPA routing through client-side routing

## Deployment Steps

### 1. Clean Project for Static Deployment

We've removed all Next.js related configurations that might conflict with the Vite setup:
- Removed Next.js dependencies from package.json
- Cleaned up tsconfig.json to remove Next.js plugin and path references
- Simplified path aliases to focus on client-side code

### 2. Create a New Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your repository
4. Vercel should automatically detect the Vite framework and use the correct settings
5. Use the following settings:
   - Framework Preset: Vite
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 3. Environment Variables

You don't need to add database credentials or API keys for static deployment since we're not using serverless functions. The client-side code is designed to use localStorage for API data.

### 4. Deploy

Click "Deploy" to start the static deployment process.

## How the Static Deployment Works

The static deployment process works as follows:

1. `vercel.json` - Configures the build process and static asset serving:
   - Sets Vite as the framework
   - Uses a standard build command
   - Configures SPA routing with the `rewrites` section

2. `client/public/generate-static-api.js` - Browser-side script that:
   - Creates localStorage entries with static data for API endpoints
   - Loads automatically when the site loads
   - Provides data for skills, projects, blog posts, etc.

3. `client/src/lib/queryClient.ts` - Modified to:
   - Detect when running on Vercel production
   - Use localStorage data instead of API endpoints in production
   - Fall back gracefully when endpoints don't exist

## Limitations of Static Deployment

The static deployment has some limitations:

1. No database access - all data must be pre-defined in the static API generator
2. No dynamic API endpoints - cannot submit forms that need processing
3. No authentication - admin features won't work
4. No real-time updates - data only changes when you redeploy

## When to Use Full Deployment vs. Static Deployment

- **Static Deployment**: Use for showcasing your portfolio when you don't need dynamic features
- **Full Deployment**: Use when you need full database access, authentication, and API functionality

## Updating the Static Deployment

To update your static deployment:

1. Make your changes locally
2. Update the static data in `client/public/generate-static-api.js` if needed
3. Commit and push to GitHub
4. Vercel will automatically redeploy

## Technical Details

### File Structure for Static Deployment

```
dist/
├── index.html           # Main SPA entry point with static API script
├── assets/              # Static assets
└── generate-static-api.js  # Script that populates localStorage with API data
```

### Client-Side Routing

The static deployment uses client-side routing through:

1. Vercel's `rewrites` config in vercel.json that redirects all paths to index.html
2. The React router (wouter) handles client-side routing for all paths

### Static API Data

The React app attempts to fetch from real API endpoints, but when deployed to Vercel static hosting, the `queryClient.ts` redirects these requests to localStorage data populated by the generate-static-api.js script on page load.
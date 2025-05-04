# Vercel Serverless Deployment Guide for MrGuru.dev Portfolio

This guide covers how to deploy your portfolio using Vercel's Serverless Functions to support both the frontend and backend components.

## Overview of Serverless Deployment

This project has been configured to work as a full-stack application on Vercel using:

1. Static frontend deployment for the React+Vite application
2. Serverless API functions for the Express backend
3. Shared database connection via NeonDB

## Architecture

The architecture is split into two main components:

1. **Frontend**: Static files built with Vite and served from the `/dist` directory
2. **Backend**: Express API served from the `/api` directory as Vercel Serverless Functions

## Setting Up for Deployment

### 1. API Setup

The `/api` directory contains the Express application adapted for Vercel Serverless Functions:

- `api/index.ts` - Main entry point that exports the Express app
- Routes configured with the `/api` prefix to match Vercel's routing

### 2. vercel.json Configuration

The `vercel.json` file configures both the static frontend and serverless backend:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "builds": [
    { "src": "vite.config.ts", "use": "@vercel/static-build" },
    { "src": "api/**/*.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

This configuration:
- Builds the frontend with Vite
- Builds the API with the Vercel Node.js builder
- Routes API requests to the appropriate serverless function
- Routes all other requests to the SPA frontend

## Environment Variables

You need to set the following environment variables in your Vercel project:

1. **Database connection**:
   - `DATABASE_URL`: Your NeonDB connection string

2. **Authentication**:
   - `SESSION_SECRET`: A secure random string for session encryption
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret

3. **API Integration**:
   - `GITHUB_TOKEN`: Personal access token for GitHub API integration

## Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure the environment variables in the Vercel project settings
4. Deploy the project

## Database Migration

Before deployment, ensure your database schema is up to date by running:

```
npm run db:push
```

This will update the database schema to match your current code.

## Testing Your Deployment

After deployment, you should test:

1. **Frontend**: All pages load and the site navigation works
2. **API Endpoints**: Test key API endpoints like `/api/skills` and `/api/projects`
3. **Authentication**: Test login, registration, and protected routes
4. **Database Operations**: Verify that data is correctly saved and retrieved

## Troubleshooting

If you encounter issues:

1. **Function Timeout**: Check if your functions are timing out (default limit is 10 seconds)
2. **Cold Starts**: Serverless functions may have slow initial response times
3. **Memory Limits**: Ensure your functions stay within memory limits (default 1024MB)
4. **Logs**: Check the Vercel function logs for error details

## Advantages of Serverless Deployment

1. **Scalability**: Automatically scales with traffic
2. **Cost Efficiency**: Pay only for what you use
3. **Reliability**: Managed infrastructure with high availability
4. **Integrated**: Seamless deployment workflow with GitHub integration

## Limitations

1. **Cold Starts**: Initial requests may be slower
2. **Statelessness**: Serverless functions are stateless, so state must be managed in the database
3. **Execution Time**: Limited execution time (10-second timeout by default)
4. **File System**: No persistent file system (use cloud storage for uploads)
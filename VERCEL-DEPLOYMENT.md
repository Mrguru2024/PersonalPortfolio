# Vercel Deployment Guide for MrGuru.dev Portfolio

This guide will help you deploy your portfolio application to Vercel, ensuring that all features work correctly in production.

## Prerequisites

Before deploying to Vercel, make sure you have:

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A GitHub account (for repo hosting and OAuth authentication)
3. A PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)
4. Required API keys (GitHub, SendGrid, etc.)

## Step 1: Set Up Your Database

The application requires a PostgreSQL database. You have several options:

### Option A: Vercel Postgres (Recommended for Vercel deployments)

1. In your Vercel dashboard, go to the Storage tab
2. Click "Create Database" and select PostgreSQL
3. Follow the setup instructions
4. Vercel will automatically add the `DATABASE_URL` to your environment variables

### Option B: Neon Database (Free tier available)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Get your connection string from the dashboard
4. Add it as `DATABASE_URL` in your Vercel environment variables

## Step 2: Set Up Environment Variables

In your Vercel project settings, add the following environment variables:

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=random_secure_string
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_TOKEN=your_github_personal_access_token
FRONTEND_URL=https://your-vercel-domain.com
FROM_EMAIL=your-email@example.com
CONTACT_EMAIL=contact@example.com
```

## Step 3: GitHub OAuth Configuration

For GitHub authentication to work:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create or update your OAuth App
3. Set the Authorization callback URL to:
   ```
   https://your-vercel-domain.com/api/auth/github/callback
   ```
4. Copy the Client ID and Client Secret to your Vercel environment variables

## Step 4: GitHub Skills Integration

For GitHub skills tracking:

1. Create a personal access token with `repo` and `user` scopes
2. Add this token as `GITHUB_TOKEN` in your Vercel environment variables

## Step 5: Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the configuration
3. Use the following settings:
   - Build Command: `node vercel-build.js` (already configured in vercel.json)
   - Output Directory: `dist` (already configured in vercel.json)
   - Install Command: `npm install` (already configured in vercel.json)

## Step 6: Run Database Migrations

After your first deployment:

1. You need to run the database migrations to create the tables
2. Use Vercel CLI or the Vercel dashboard to run:
   ```
   npm run db:push
   ```

## Troubleshooting

If you encounter issues after deployment:

1. **Database Connection Issues**:
   - Check that your `DATABASE_URL` is correct
   - Ensure your database allows connections from Vercel's IP ranges

2. **GitHub Authentication Issues**:
   - Verify the OAuth callback URL is correct
   - Check that GitHub OAuth credentials are correctly configured

3. **GitHub Skills Data Issues**:
   - Verify your GitHub token has the required permissions
   - Check logs for any API rate limiting messages

4. **General Deployment Issues**:
   - Review the Vercel build logs
   - Try redeploying after fixing any environment variable issues
   - Check that all required environment variables are set

## Additional Information

- The application uses a custom server setup for Vercel via `server/vercel.ts`
- The build process is customized using `vercel-build.js` to ensure proper bundling
- All API routes are properly configured to work in the Vercel serverless environment
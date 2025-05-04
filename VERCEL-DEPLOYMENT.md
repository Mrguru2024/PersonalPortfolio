# Vercel Deployment Guide for MrGuru.dev Portfolio

This guide provides step-by-step instructions for deploying your portfolio website to Vercel for production.

## Prerequisites

Before starting the deployment process, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you don't have an account
2. **GitHub Account**: Connected to your Vercel account
3. **Required Environment Variables**: As listed in `.env.example`

## Environment Variables

Add these environment variables in the Vercel project settings:

| Variable Name | Description |
|---------------|-------------|
| `GITHUB_TOKEN` | Personal access token for GitHub API integration |
| `GITHUB_USERNAME` | Your GitHub username (default: Mrguru2024) |
| `GITHUB_CLIENT_ID` | OAuth App Client ID for GitHub login |
| `GITHUB_CLIENT_SECRET` | OAuth App Secret for GitHub login |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random string for session encryption |
| `NODE_ENV` | Set to "production" |

## Deployment Steps

### Option 1: Deploy from GitHub

1. Push your code to GitHub
2. Log in to Vercel Dashboard
3. Click "Import Project"
4. Select "Import Git Repository"
5. Choose your portfolio repository
6. Configure project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
7. Add environment variables from above
8. Click "Deploy"

### Option 2: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Deploy:
   ```
   vercel
   ```

4. Follow the prompts to configure your project
5. For subsequent deployments use:
   ```
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Custom Domain Setup

1. Go to Project Settings > Domains
2. Add your domain (e.g., mrguru.dev)
3. Follow DNS configuration instructions

### 2. GitHub OAuth Configuration

1. Update your GitHub OAuth App settings with your production callback URL:
   - Go to GitHub Developer Settings > OAuth Apps
   - Update Authorization callback URL to `https://yourdomain.com/api/auth/github/callback`

### 3. Database Setup

Ensure your database is properly migrated:

1. Make sure your PostgreSQL database is accessible from Vercel
2. Run migrations on first deployment

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limiting**
   - Check that your GitHub token has sufficient permissions
   - Verify the token is correctly configured in environment variables

2. **Database Connection Errors**
   - Ensure your database allows connections from Vercel's IP ranges
   - Check your DATABASE_URL format and credentials

3. **Build Failures**
   - Review build logs in Vercel dashboard
   - Make sure dependencies are properly installed

### Helpful Commands

To test your production build locally before deploying:

```bash
# Build the project
npm run build

# Serve the production build
npx serve -s dist
```

## Monitoring and Analytics

After deployment, consider setting up:

1. **Vercel Analytics**: Enable in Project Settings
2. **Google Analytics**: Add your tracking ID
3. **Error Monitoring**: Configure Sentry or similar service

## Security Best Practices

1. Never commit sensitive environment variables
2. Regularly rotate your secrets and tokens
3. Enable GitHub branch protection for production branches
4. Set up automatic HTTPS redirects (default with Vercel)

---

For additional support, contact Anthony Feaster at [your contact information]
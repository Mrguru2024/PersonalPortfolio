# MrGuru Portfolio Website

A cutting-edge, interactive developer portfolio website that offers an immersive user experience through dynamic content and intelligent project demonstration capabilities.

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Express, Node.js
- State Management: React Query
- Form Validation: Zod
- Database: PostgreSQL
- Authentication: GitHub OAuth

## Deployment Instructions for Vercel

### 1. Push to GitHub

Make sure your project is pushed to a GitHub repository.

### 2. Connect to Vercel

1. Create a Vercel account if you don't have one: [Vercel Signup](https://vercel.com/signup)
2. Connect your GitHub account to Vercel
3. Import your repository

### 3. Configure Project Settings

Use the following settings in the Vercel deployment configuration:
- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: Leave blank (configured in vercel.json)
- **Output Directory**: dist
- **Install Command**: Leave blank (configured in vercel.json)

### 4. Set Environment Variables

Add the following environment variables in the Vercel project settings:

```
DATABASE_URL=postgres://username:password@host:port/database
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_session_secret
NODE_ENV=production
```

If using SendGrid for email functionality, also add:
```
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 5. Database Setup

For the database, you have several options:

1. **Vercel Postgres**: The easiest option to set up directly in Vercel
   - Go to Storage tab in your Vercel dashboard
   - Click "Create Database" and select Postgres
   - Vercel will automatically set DATABASE_URL environment variable

2. **Neon Database**: Works well with Vercel and offers a generous free tier
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string to your `DATABASE_URL` environment variable

3. **Other options**: Supabase or Railway are also good choices

After setting up your database, make sure to run the migration command to create your tables:

```bash
# In your local development environment
npm run db:push
```

### 6. Deploy

1. Review the Vercel configuration files in your project:
   - `vercel.json`: Contains all the build and routing configurations
   - `server/vercel.ts`: Optimized server entry point for Vercel
   - `vercel-build.js`: Custom build script for better reliability

2. Click "Deploy" in the Vercel dashboard.

### 7. Verify Deployment

Once deployed, check:
- The frontend is loading correctly
- API endpoints are responding properly
- Database connections are working
- GitHub authentication is functioning (may need to update callback URLs)

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Ensure database is accessible from Vercel

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Push database schema changes
npm run db:push

# Build for production
npm run build

# Start production server
npm start
```

## Features

- Interactive project showcases with live demos
- Blog with content management
- Resume request and download functionality
- GitHub OAuth authentication
- Admin dashboard for content management
- Responsive design for all devices
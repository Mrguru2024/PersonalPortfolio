# Migration Guide: Express+Vite → Next.js

This guide explains how to switch between the Express+Vite setup and the Next.js version of MrGuru.dev portfolio.

## Quick Reference

1. To run the **Express+Vite** version:
   ```bash
   npm run dev
   ```

2. To run the **Next.js** version:
   ```bash
   ./next-start.sh
   ```

## Migration Status

- ✅ Next.js App Router structure created
- ✅ Core components migrated (JourneyExperience, CustomCursor, etc.)
- ✅ API routes for skills and skill endorsements implemented
- ✅ Authentication via NextAuth configured
- ✅ Database connection established
- 🔄 Page content migration in progress

## Migration Benefits

- **Improved Performance**: Server-side rendering and static generation
- **Better SEO**: Built-in metadata optimization
- **Simplified Routing**: Next.js App Router eliminates need for custom navigation
- **API Routes**: Serverless functions replace Express endpoints
- **Authentication**: NextAuth integration simplifies GitHub OAuth

## Folder Structure

- `app/`: Next.js App Router structure
  - `api/`: API routes (replacing Express endpoints)
  - `components/`: UI components
  - `lib/`: Utility functions
  - `page.tsx`: Home page
  - `layout.tsx`: Root layout
  - `template.tsx`: Layout with animations
  - `globals.css`: Global styles
- `server/`: Express server (legacy)
- `client/`: Vite frontend (legacy)
- `shared/`: Shared modules (used by both versions)

## Known Issues

- Some TypeScript errors remain in the API routes related to Drizzle ORM
- Database relations need to be properly configured in the schema
- Environment variables need to be properly set up for both environments

## Deployment

The Next.js version is ready for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy from the main branch

## Support

If you encounter any issues during migration, check:

1. Database connection
2. Environment variables
3. API route implementations
4. Component import paths

The migration is designed to be non-destructive - your Express+Vite setup will continue to work alongside the Next.js version.
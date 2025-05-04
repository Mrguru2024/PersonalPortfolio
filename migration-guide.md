# Migration from Vite to Next.js

This project is being migrated from a Vite+Express setup to a Next.js application.

## Current Status

- ✅ Next.js app structure is set up (in the `/app` directory)
- ✅ Next.js configuration is in place (next.config.mjs)
- ❌ Vite dependencies are still present
- ⚠️ Express server is configured for Vite and needs updating

## How to Run the Next.js Version

There are two ways to start the Next.js version of the application:

### 1. Using the script (recommended)

```bash
./start-nextjs.sh
```

This will start the Next.js development server on port 3000.

### 2. Manually with NPX

```bash
npx next dev
```

## API Routes

The existing Express API routes will need to be migrated to Next.js API routes.
For now, they continue to be served by the Express server.

## Next Steps

1. Create more Next.js pages based on the existing app structure
2. Migrate Express API routes to Next.js API routes
3. Remove Vite dependencies from package.json
4. Update workflow configuration to use Next.js

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Migrating from Vite](https://nextjs.org/docs/pages/building-your-application/upgrading/from-vite)
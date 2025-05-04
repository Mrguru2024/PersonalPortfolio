/**
 * Vercel-specific production middleware
 * This middleware adds optimization for Vercel's production environment
 */

import { Request, Response, NextFunction } from 'express';

const VERCEL_DEPLOYMENT = process.env.VERCEL === '1';
const VERCEL_ENV = process.env.VERCEL_ENV;
const VERCEL_URL = process.env.VERCEL_URL;

// Production-only middleware for Vercel deployments
export function vercelProductionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (VERCEL_DEPLOYMENT) {
    // Add Vercel-specific headers
    if (VERCEL_ENV === 'production') {
      // Security headers for production
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubdomains; preload');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // Content Security Policy - customize based on your needs
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com;"
      );
    }
    
    // Set cache control headers appropriate for Vercel
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      // Cache static assets for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path.startsWith('/api/')) {
      // Don't cache API responses
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    } else {
      // Cache HTML for a short time
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
    }
    
    // Add canonical URL for SEO
    if (VERCEL_ENV === 'production' && VERCEL_URL && req.method === 'GET' && !req.path.startsWith('/api/')) {
      const protocol = 'https';
      const host = req.headers['x-forwarded-host'] || VERCEL_URL;
      const canonicalUrl = `${protocol}://${host}${req.originalUrl}`;
      res.locals.canonicalUrl = canonicalUrl;
    }
    
    // Log Vercel-specific info (for debugging)
    if (process.env.DEBUG === 'true') {
      console.log(`[vercel] ${req.method} ${req.path} (${VERCEL_ENV})`);
    }
  }
  
  next();
}

// Export a function to register the middleware
export function setupVercelMiddleware(app: any) {
  app.use(vercelProductionMiddleware);
  
  if (VERCEL_DEPLOYMENT) {
    console.log(`[vercel] Running in ${VERCEL_ENV || 'unknown'} environment`);
    if (VERCEL_URL) {
      console.log(`[vercel] URL: ${VERCEL_URL}`);
    }
  }
}
// Type declarations for Vite server options
import 'vite';

declare module 'vite' {
  interface ServerOptions {
    middlewareMode?: boolean;
    hmr?: any;
    allowedHosts?: boolean | string[];
  }
}
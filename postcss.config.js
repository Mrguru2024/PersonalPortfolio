// PostCSS config - ES module format
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let autoprefixerPlugin = null;
try {
  autoprefixerPlugin = require('autoprefixer');
} catch (error) {
  // autoprefixer not installed - will skip it
  console.warn('[PostCSS] autoprefixer not found. CSS vendor prefixes will not be added.');
}

export default {
  plugins: {
    tailwindcss: {},
    ...(autoprefixerPlugin ? { autoprefixer: {} } : {}),
  },
}
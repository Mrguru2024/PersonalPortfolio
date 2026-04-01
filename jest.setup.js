process.env.NODE_ENV = 'test';

require('@testing-library/jest-dom');

// Load .env.local so tests see the same env as Next.js (e.g. OPENAI_API_KEY)
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

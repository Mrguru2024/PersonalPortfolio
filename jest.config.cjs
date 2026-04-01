// Force React's test/development entry (exports `act`). Production `react`
// omits `act`; `react-dom/test-utils` still forwards to it →
// "React.act is not a function" when the shell sets NODE_ENV=production.
process.env.NODE_ENV = 'test';

const path = require('path');

/** Resolve CJS development files without `exports` (Node + Next require hook blocks subpaths). */
function reactCjsDev(filename) {
  return path.join(__dirname, 'node_modules', 'react', 'cjs', filename);
}

function reactDomCjsDev(filename) {
  return path.join(__dirname, 'node_modules', 'react-dom', 'cjs', filename);
}

/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup-env.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  moduleNameMapper: {
    // Pin React to development builds so `act` always exists (production `react`
    // and `react/jsx-runtime` omit / break `act`; env can end up `production`
    // after Next `loadEnvConfig` or IDE runners).
    '^react$': reactCjsDev('react.development.js'),
    '^react/jsx-runtime$': reactCjsDev('react-jsx-runtime.development.js'),
    '^react/jsx-dev-runtime$': reactCjsDev('react-jsx-dev-runtime.development.js'),
    '^react-dom$': reactDomCjsDev('react-dom.development.js'),
    '^react-dom/client$': reactDomCjsDev('react-dom-client.development.js'),
    '^react-dom/test-utils$': reactDomCjsDev('react-dom-test-utils.development.js'),
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
};

module.exports = createJestConfig(config);

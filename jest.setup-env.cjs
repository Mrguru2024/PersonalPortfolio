'use strict';

// React 19's production `react` bundle omits `React.act`. `react-dom/test-utils`
// still forwards to `React.act`, which throws. Some Jest runners (e.g. IDE
// integrations) invoke tests with NODE_ENV=production; force `test` like Jest's
// default so the development `react` build loads.
process.env.NODE_ENV = 'test';

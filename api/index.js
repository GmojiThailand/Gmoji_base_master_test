'use strict';

// Vercel serverless function handler for Koa 1.x
// This wraps the Koa app to work with Vercel's serverless environment

// Set environment variable to prevent app.listen()
process.env.VERCEL = '1';

// Import the app (it will export itself without listening)
const app = require('../app');

// Use serverless-http to wrap Koa app
// serverless-http supports Koa 1.x generator functions
const serverless = require('serverless-http');

// Export the handler
module.exports = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});

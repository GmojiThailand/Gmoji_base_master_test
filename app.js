'use strict';
require('dotenv').config();

const Koa = require('koa');
const morgan = require('koa-morgan');
const body = require('koa-better-body');
const cors = require('koa-cors');
const swagger = require('swagger-koa');
const fs = require('fs');
const path = require('path');

const swaggerSpec = require('./config/swagger/index');
const generalConfig = require('./config/general');

const app = new Koa();

// Use `hostname` from config if present; fall back to 0.0.0.0 to allow external
// access when running in containers or on remote hosts.
const hostname = (generalConfig.hostname || generalConfig.host) ? (generalConfig.hostname || generalConfig.host) : '0.0.0.0';
const port = generalConfig.port ? generalConfig.port : '3001';

// Initialize SDK config only if not in serverless or if MongoDB URL is available
// This prevents MongoDB connection attempts when DB is not configured
// Load SDK conditionally to avoid MongoDB connection errors
try {
  // Check if MongoDB URL is available before configuring SDK
  const hasMongoUrl = process.env.MONGODB_URL || process.env.MONGO_URL || 
                      process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
  
  if (hasMongoUrl || !process.env.VERCEL) {
    const SDK = require('sdk');
    const sdkConfig = require('./config/sdk')();
    SDK.configure(sdkConfig);
  } else {
    console.warn('MongoDB URL not found. SDK will not be initialized. Some features may not work.');
  }
} catch (e) {
  console.warn('SDK configuration skipped:', e.message);
}

require('koa-qs')(app, 'extended');

app.use(function* (next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = {statusCode: err.status || 500, message: err.message};
    this.app.emit('error', err, this);
  }
});

app.use(cors());
app.use(morgan.middleware('combined'));
app.use(body({
  querystring: require('qs'),
  jsonLimit: '10mb',
}));

const router = require('./controllers/index');

// Add Swagger routes before mounting router
router.get('/api/swagger/spec.json', function* () {
  this.type = 'application/json';
  this.body = swaggerSpec;
});

// Serve Swagger UI HTML - use process.cwd() for Vercel compatibility
router.get('/api/swagger', function* () {
  // Try multiple path resolutions for compatibility
  let swaggerHtmlPath;
  try {
    // First try __dirname (works locally)
    swaggerHtmlPath = path.join(__dirname, 'public', 'swagger', 'index.html');
    if (!fs.existsSync(swaggerHtmlPath)) {
      // Fallback to process.cwd() (works on Vercel)
      swaggerHtmlPath = path.join(process.cwd(), 'public', 'swagger', 'index.html');
    }
  } catch (e) {
    swaggerHtmlPath = path.join(process.cwd(), 'public', 'swagger', 'index.html');
  }
  
  if (!fs.existsSync(swaggerHtmlPath)) {
    this.status = 500;
    this.body = { error: 'Swagger UI file not found', path: swaggerHtmlPath };
    return;
  }
  
  this.type = 'text/html';
  this.body = fs.readFileSync(swaggerHtmlPath, 'utf8');
});

// Mount router BEFORE swagger.init to ensure our routes take precedence
app.use(router.routes());
app.use(router.allowedMethods());

// Swagger init should come after router to avoid conflicts
app.use(swagger.init({
  swaggerVersion: '2.0',
  swaggerURL: '/api/swagger',
  swaggerUI: './public/swagger/',
  basePath: '/api',
}));

// Add a catch-all route for debugging (should be last)
app.use(function* (next) {
  if (this.status === 404) {
    console.log('404 - Path not found:', this.path, 'Method:', this.method);
  }
  yield next;
});

app.on('error', (err, ctx) => {
  console.error('Application Error', err, ctx);
});

// Only listen if not in serverless environment (Vercel)
// When running in api/ directory, Vercel will handle the serverless function
if (!process.env.VERCEL && !process.env.VERCEL_ENV && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(port, hostname, () => {
    console.log(`Server started on ${hostname}:${port}`);
  });
}

// Export app for both local and serverless (api/index.js will wrap it)
module.exports = app;

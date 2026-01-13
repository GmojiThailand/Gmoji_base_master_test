'use strict';
require('dotenv').config();

const Koa = require('koa');
const morgan = require('koa-morgan');
const body = require('koa-better-body');
const cors = require('koa-cors');
const SDK = require('sdk');
const swagger = require('swagger-koa');
const fs = require('fs');
const path = require('path');

const swaggerSpec = require('./config/swagger/index');
const generalConfig = require('./config/general');
const sdkConfig = require('./config/sdk')();

const app = new Koa();

// Use `hostname` from config if present; fall back to 0.0.0.0 to allow external
// access when running in containers or on remote hosts.
const hostname = (generalConfig.hostname || generalConfig.host) ? (generalConfig.hostname || generalConfig.host) : '0.0.0.0';
const port = generalConfig.port ? generalConfig.port : '3001';

SDK.configure(sdkConfig);

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
  
  this.type = 'text/html';
  this.body = fs.readFileSync(swaggerHtmlPath, 'utf8');
});

app.use(swagger.init({
  swaggerVersion: '2.0',
  swaggerURL: '/api/swagger',
  swaggerUI: './public/swagger/',
  basePath: '/api',
}));

app.use(router.routes());

app.on('error', (err, ctx) => {
  console.error('Application Error', err, ctx);
});

// Only listen if not in serverless environment (Vercel)
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  app.listen(port, hostname, () => {
    console.log(`Server started on ${hostname}:${port}`);
  });
}

// Export handler for Vercel serverless
// Vercel will automatically use this when using @vercel/node
// For Koa 1.x, we need to use serverless-http adapter
if (process.env.VERCEL || process.env.VERCEL_ENV) {
  try {
    const serverless = require('serverless-http');
    module.exports = serverless(app.callback());
  } catch (e) {
    // If serverless-http is not installed, export app directly
    // @vercel/node should handle Koa apps
    console.warn('serverless-http not found, using default export');
    module.exports = app;
  }
} else {
  // Export app for local development
  module.exports = app;
}

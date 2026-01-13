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

// Lazy load SDK to reduce cold start time in serverless
// SDK will be initialized on first request that needs it
let SDKInitialized = false;
function initializeSDK() {
  if (SDKInitialized) return;
  
  try {
    // Check if MongoDB URL is available before configuring SDK
    const hasMongoUrl = process.env.MONGODB_URL || process.env.MONGO_URL || 
                        process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
    
    if (hasMongoUrl || !process.env.VERCEL) {
      const SDK = require('sdk');
      const sdkConfig = require('./config/sdk')();
      SDK.configure(sdkConfig);
      SDKInitialized = true;
    } else {
      console.warn('MongoDB URL not found. SDK will not be initialized. Some features may not work.');
    }
  } catch (e) {
    console.warn('SDK configuration skipped:', e.message);
  }
}

// For Swagger routes, we don't need SDK - skip initialization
// SDK will be initialized lazily when needed by other routes

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

// Lazy load router to avoid loading all controllers on cold start
// This significantly reduces initialization time
let router = null;
function getRouter() {
  if (!router) {
    router = require('./controllers/index');
    // Initialize SDK when router is first loaded (if needed)
    initializeSDK();
  }
  return router;
}

// Create a lightweight router for Swagger (doesn't need SDK)
const swaggerRouter = require('koa-router')();

// Add Swagger routes - these don't need SDK or MongoDB
swaggerRouter.get('/api/swagger/spec.json', function* () {
  console.log('Swagger spec.json requested');
  this.type = 'application/json';
  this.body = swaggerSpec;
});

// Serve Swagger UI HTML
// Try to read file, but fallback to embedded HTML if file not found (for Vercel)
swaggerRouter.get('/api/swagger', function* () {
  console.log('Swagger UI requested, path:', this.path);
  let htmlContent = null;
  
  // Try multiple path resolutions for compatibility
  const possiblePaths = [
    path.join(__dirname, 'public', 'swagger', 'index.html'),
    path.join(process.cwd(), 'public', 'swagger', 'index.html'),
    path.join(__dirname, '..', 'public', 'swagger', 'index.html'),
  ];
  
  for (const htmlPath of possiblePaths) {
    try {
      if (fs.existsSync(htmlPath)) {
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  // Fallback to embedded HTML if file not found (for Vercel serverless)
  if (!htmlContent) {
    console.log('Using embedded Swagger HTML (file not found)');
    htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
      }
      #swagger-ui {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '/api/swagger/spec.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>`;
  } else {
    console.log('Using Swagger HTML from file');
  }
  
  this.type = 'text/html';
  this.body = htmlContent;
});

// Mount Swagger router first (lightweight, no SDK needed)
app.use(swaggerRouter.routes());
app.use(swaggerRouter.allowedMethods());

// Mount main router (lazy loaded, will initialize SDK when needed)
// Use a wrapper to lazy load router on first request
const mainRouterWrapper = function* (next) {
  const mainRouter = getRouter();
  // Create a temporary app context to mount router
  const routerMiddleware = mainRouter.routes();
  yield routerMiddleware.call(this, next);
};

const mainRouterAllowedMethods = function* (next) {
  const mainRouter = getRouter();
  const allowedMethods = mainRouter.allowedMethods();
  yield allowedMethods.call(this, next);
};

app.use(mainRouterWrapper);
app.use(mainRouterAllowedMethods);

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

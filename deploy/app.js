'use strict';

const Koa = require('koa');
const morgan = require('koa-morgan');
const body = require('koa-better-body');
const cors = require('koa-cors');
const SDK = require('sdk');
const swagger = require('swagger-koa');

const swaggerSpec = require('./config/swagger/index');
const generalConfig = require('./config/general');
const sdkConfig = require('./config/sdk')();

const app = module.exports = new Koa();

const hostname = generalConfig.host ? generalConfig.host : '127.0.0.1';
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

app.use(swagger.init({
  swaggerVersion: '2.0',
  swaggerURL: '/api/swagger',
  swaggerUI: './public/swagger/',
  basePath: '/api',
}));

app.use(router.routes());

app.use(router.get('/api/swagger/spec.json', function* () {
  this.body = swaggerSpec;
}).routes());

app.on('error', (err, ctx) => {
  console.error('Application Error', err, ctx);
});

app.listen(port, hostname, () => {
  console.log(`Server started on ${hostname}:${port}`);
});

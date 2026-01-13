/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const applications = {};

function SDK(appId) {
  if (!appId && Object.keys(applications).length) {
    return applications[Object.keys(applications).pop()];
  }

  return applications[appId];
}

SDK.init = (options) => {
  return co(function* () {
    let {application} = options;
    SDK.configure(options);
    let app = yield SDK.Application.find({id: application});

    return app;
  })
    .catch((err) => console.error(err.stack));
};

SDK.configure = (options) => {
  SDK.Config.configure(options);
};

Object.defineProperty(SDK, 'Config', {get: () => require('./models/Config')});
Object.defineProperty(SDK, 'Error', {get: () => require('./models/Error')});
Object.defineProperty(SDK, 'DBAdapter', {get: () => require('./models/DBAdapter')});
Object.defineProperty(SDK, 'Auth', {get: () => require('./models/Auth')});
Object.defineProperty(SDK, 'Application', {get: () => require('./models/Application')});
Object.defineProperty(SDK, 'User', {get: () => require('./models/User')});
Object.defineProperty(SDK, 'Role', {get: () => require('./models/Role')});
Object.defineProperty(SDK, 'Entity', {get: () => require('./models/Entity')});
Object.defineProperty(SDK, 'Table', {get: () => require('./models/Table')});
Object.defineProperty(SDK, 'Service', {get: () => require('./models/Service')});
Object.defineProperty(SDK, 'Script', {get: () => require('./models/Script')});
Object.defineProperty(SDK, 'KoaRouter', {get: () => require('./models/KoaRouter')});
Object.defineProperty(SDK, 'ExpressRouter', {get: () => require('./models/ExpressRouter')});
Object.defineProperty(SDK, 'Log', {get: () => require('./models/Log')});
Object.defineProperty(SDK, 'Swagger', {get: () => require('./models/Swagger')});

module.exports = SDK;

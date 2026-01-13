'use strict';

const fs = require('fs');
const path = require('path');

const swagger = require('../config/swagger');

const OUTPUT_FILENAME = 'Gmoji.postman_collection.json';
const POSTMAN_SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

const collection = {
  info: {
    name: 'Gmoji API',
    description: 'Postman collection generated from Swagger definition.',
    schema: POSTMAN_SCHEMA,
  },
  item: [],
  variable: [
    {
      key: 'baseUrl',
      value: 'http://127.0.0.1:3001',
      type: 'string',
    },
    {
      key: 'authToken',
      value: '',
      type: 'string',
    },
  ],
};

const folderMap = new Map();
const rootItems = [];

function ensureFolder(tag) {
  if (!folderMap.has(tag)) {
    const folder = {
      name: tag,
      item: [],
    };
    folderMap.set(tag, folder);
    collection.item.push(folder);
  }

  return folderMap.get(tag);
}

function toStringValue(value, placeholderName) {
  if (value === undefined || value === null) {
    return placeholderName ? `{{${placeholderName}}}` : '';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (err) {
      return String(value);
    }
  }

  return String(value);
}

function buildUrl(pathKey, parameters) {
  const cleanPath = pathKey.split('#')[0];
  const basePath = (swagger.basePath || '').replace(/\/$/, '');
  const pathWithBase = `${basePath}${cleanPath}`;
  const rawPath = pathWithBase.replace(/\{(.+?)\}/g, '{{$1}}');

  const pathSegments = rawPath
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean);

  const url = {
    raw: `{{baseUrl}}${rawPath}`,
    host: ['{{baseUrl}}'],
    path: pathSegments,
  };

  const pathParams = parameters.filter((param) => param.in === 'path');
  if (pathParams.length > 0) {
    url.variable = pathParams.map((param) => ({
      key: param.name,
      value: toStringValue(param.default, param.name),
      description: param.description || '',
    }));
  }

  const queryParams = parameters.filter((param) => param.in === 'query');
  if (queryParams.length > 0) {
    url.query = queryParams.map((param) => ({
      key: param.name,
      value: toStringValue(param.default, param.name),
      description: param.description || '',
      disabled: !param.required,
    }));
  }

  return url;
}

function buildHeaders(parameters) {
  return parameters
    .filter((param) => param.in === 'header')
    .map((param) => ({
      key: param.name,
      value: toStringValue(param.default, param.name === 'Authorization' ? 'authToken' : param.name),
      description: param.description || '',
      disabled: !param.required && param.default === undefined,
    }));
}

function buildBody(parameters, consumes = []) {
  const bodyParams = parameters.filter((param) => param.in === 'body');
  const formParams = parameters.filter((param) => param.in === 'formData');

  if (bodyParams.length === 0 && formParams.length === 0) {
    return undefined;
  }

  if (formParams.length > 0) {
    return {
      mode: 'formdata',
      formdata: formParams.map((param) => ({
        key: param.name,
        value: param.type === 'file'
          ? undefined
          : toStringValue(param.default, param.name),
        type: param.type === 'file' ? 'file' : 'text',
        description: param.description || '',
        disabled: !param.required && param.default === undefined,
      })),
    };
  }

  const bodyParam = bodyParams[0];
  let rawBody = '';

  if (bodyParam.schema && bodyParam.schema.example) {
    rawBody = JSON.stringify(bodyParam.schema.example, null, 2);
  } else if (bodyParam.schema && bodyParam.schema.properties) {
    const example = {};
    Object.keys(bodyParam.schema.properties).forEach((key) => {
      const prop = bodyParam.schema.properties[key];
      if (prop && prop.example !== undefined) {
        example[key] = prop.example;
      } else {
        example[key] = '';
      }
    });
    rawBody = JSON.stringify(example, null, 2);
  }

  if (!rawBody) {
    rawBody = '{}';
  }

  const preferredType = consumes.find((type) => /json/i.test(type)) || 'application/json';

  return {
    mode: 'raw',
    raw: rawBody,
    options: {
      raw: {
        language: 'json',
      },
    },
    disabled: false,
    contentType: preferredType,
  };
}

Object.entries(swagger.paths).forEach(([pathKey, methods]) => {
  Object.entries(methods).forEach(([method, operation]) => {
    const parameters = operation.parameters || [];
    const url = buildUrl(pathKey, parameters);
    const headers = buildHeaders(parameters);
    const body = buildBody(parameters, operation.consumes);

    const request = {
      name: operation.summary || `${method.toUpperCase()} ${pathKey}`,
      request: {
        method: method.toUpperCase(),
        header: headers,
        url,
      },
    };

    if (operation.description) {
      request.request.description = operation.description;
    }

    if (body) {
      request.request.body = body;
    }

    const tags = operation.tags && operation.tags.length ? operation.tags : null;
    if (tags) {
      const folder = ensureFolder(tags[0]);
      folder.item.push(request);
    } else {
      rootItems.push(request);
    }
  });
});

if (rootItems.length > 0) {
  collection.item.push(...rootItems);
}

const outputPath = path.join(__dirname, '..', OUTPUT_FILENAME);
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log(`Postman collection saved to ${outputPath}`);


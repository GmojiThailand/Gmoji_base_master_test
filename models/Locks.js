'use strict';

const HttpError = require('./Error');
const MongoDB = require('sdk').DBAdapter.get('MongoDB');

function toMongoId(string) {
  let id = MongoDB.toId(string);
  if (id) {
    return id.toString();
  } else {
    return false;
  }
}

function validateEntity(entity) {
  let failFlag = false;

  if (typeof entity != 'string') {
    try {
      let tmp = toMongoId(entity);

      if (!tmp) {
        throw new Error();
      } else {
        entity = tmp;
      }
    } catch (e) {
      entity = entity && entity.id;
      failFlag = !toMongoId(entity);
    }
  } else {
    entity = toMongoId(entity);

    if (!entity) {
      failFlag = true;
    }
  }

  if (failFlag) {
    throw new HttpError(400, 'Incorrect entity passed');
  }

  return entity;
}

let locked = [];

class Locks {
  static lock(entities) {
    Locks.isLocked(entities);

    entities = entities.map((entity) => {
      entity = validateEntity(entity);
      return entity;
    });

    locked = [...new Set([...locked, ...entities])];
  }

  static unlock(entities) {
    if (!Array.isArray(entities) || entities.length == 0) {
      throw new HttpError(400, 'Unlock argument must be array');
    }

    entities = entities.map((entity) => {
      entity = validateEntity(entity);
      return entity;
    });

    locked = locked.filter((item) => {
      let match = true;
      entities.map((entity) => {
        if (entity == item) {
          match = false;
        }
      });

      return match;
    });
  }

  static isLocked(entities) {
    if (!Array.isArray(entities) || entities.length == 0) {
      throw new HttpError(400, 'Argument must be array');
    }

    entities = entities.map((entity) => {
      entity = validateEntity(entity);

      if (locked.includes(entity)) {
        throw new HttpError(404, 'Entity already locked');
      }

      return entity;
    });

    return false;
  }
}

module.exports = Locks;

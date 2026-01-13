/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const debugOn = false;
const memStat = false;

let recursion = 0;

const debug = function() {
  if (debugOn) {
    let args = memStat ? Array.from(arguments).concat([process.memoryUsage()]) : Array.from(arguments);
    console.log.apply(this, args);
  }
};

class AFError extends Error {
  constructor(status, message, err) {
    let handledFlag = false;

    if (status instanceof AFError) {
      debug('AFError');
      return status;
    }

    if (status instanceof Error) {
      debug('Error');
      err = status;
      status = err.status;
      message = message || err.message;
    }

    if (typeof status == 'string' && parseInt(status) !== status) {
      debug('message/message+object');
      err = typeof message == 'object' ? message : err;
      message = status;
      status = err && err.status;
    }

    if (typeof status == 'object') {
      debug('object');
      let handled = AFError.handleErrorObject(status);

      status = handled.status;
      message = handled.message;
      err = handled.err;
      handledFlag = true;
    }

    if (typeof message == 'object') {
      debug('status+object');
      err = message;
      message = err.message;
    }

    if (!handledFlag && typeof err == 'object' && !(err instanceof Error)) {
      debug('status+object/status+message+object');
      let handled = AFError.handleErrorObject(err);

      err = handled.err;
      message = message || handled && handled.message || err && err.message;
      err && err.message || err && err[0] && err[0].message || 'Undefined error';
      status = parseInt(status) || handled && handled.status || err && err.status || err && err[0] && err[0].status;
      // debug('Not instance of Error object\r\n', handled.message, handled.err);
    }

    super(message);

    this.status = status || 500;
    this.error = err;
  }

  static handleErrorObject(object) {
    recursion++;

    debug('Recursion', recursion);
    if (recursion > 10) { return {message: 'Undefined error'}; }

    let status;
    let message;
    let err;

    if (Array.isArray(object)) {
      message = '';

      debug(object);

      err = object.filter((v) => {
        if (v instanceof Error) {
          debug(`${v} instanse of Error`);
          message += '\n' + v.message;
          return v;
        }

        return false;
      });

      debug(err);

      message = message || 'Multiple errors detected';

      if (!err.length) {
        err = undefined;
      } else {
        err = err.length == 1 ? err[0] : err;
        message = message || err && err.message || err && err[0] && err[0].message || 'Undefined error';
        status = err & err.status || err && err[0] && err[0].status;
      }
    } else {
      object = object || {};
      message = object.message;
      err = object.error;
      status = object.status;

      debug(object.status);

      if (err && typeof err == 'object') {
        if (!(err instanceof Error)) {
          let handled = AFError.handleErrorObject(err);
          err = handled.err;
          status = status || handled && handled.status || err && err.status || err && err[0] && err[0].status;
          message = message || handled && handled.message || err && err.message || err && err[0] && err[0].message;
        }

        debug(status);
        status = status || err && err.status;
        message = message || err && err.message;
      }

      message = message || 'Undefined error';
    }

    err = err && err.length == 1 ? err[0] : err;
    recursion = 0;

    return {status, message, err};
  }
}

module.exports = AFError;

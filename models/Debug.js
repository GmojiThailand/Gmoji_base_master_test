'use strict';

const os = require('os');

class Debug {
  log(message) {
    console.log(`${new Date(Date.now())} - ${message ? message : 'Debugging'}`);
    // console.log('CPU Usage:\n', os.cpus());
    console.log('Total Memory:', os.totalmem());
    console.log('Free Memory:', os.freemem());
  }
}

module.exports = Debug;

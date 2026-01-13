'use strict';

const fs = require('fs');

const models = {};
const utils = {};

function firstLetterDown(string) {
  return string[0].toLowerCase() + string.substring(1);
};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .map((file) => {
    const filename = file.replace('.js', '');
    const method = firstLetterDown(filename);

    models[file] = require(`./${file}`);
    utils[method] = models[file].exec;
  });

module.exports = utils;

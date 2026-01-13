function generateDefinitions() {
  const fs = require('fs');

  let definitions = {};

  fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .map((file) => {
    let part = require(`./${file}`);
    Object.assign(definitions, part);
  });

  return definitions;
}

module.exports = generateDefinitions();

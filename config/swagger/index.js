function generatePaths() {
  const fs = require('fs');

  let paths = {};

  fs
    .readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .map((file) => {
      let part = require(`./${file}`);
      Object.assign(paths, part);
    });

  return paths;
}

module.exports = {
  swagger: '2.0',
  info: {
    title: 'Gmoji',
    version: '1.0.0',
  },
  basePath: '/api/v1',
  paths: generatePaths(),
  securityDefinitions: {
    apiKey: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'ex.: Bearer 91ae3866cb9b1441d152c205cd8dc622118f6ef9',
    },
  },
  definitions: require('./definitions'),
};

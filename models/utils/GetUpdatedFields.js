'use strict';

exports.exec = function* (entityData, fields, schema) {
  return Object.keys(fields)
    .filter((field) => schema.hasOwnProperty(field))
    .map((field) => {
      if (typeof fields[field] === 'object') {
        if (Array.isArray(fields[field])) {
          let requestArray = fields[field];
          let srcArray = entityData[field];
          if (requestArray.length !== srcArray.length) {
            return field + '=[' + requestArray + ']';
          }
          for (let i = 0; i < requestArray.length; i++) {
            if (typeof srcArray[i] !== 'undefined' &&
              requestArray[i] === srcArray[i].toString()) {
              continue;
            }
            if (typeof srcArray[i].id !== 'undefined' &&
              requestArray[i] === srcArray[i].id.toString()) {
              continue;
            }
            return field + '=[' + requestArray + ']';
          }
        } else if(fields[field] === null && entityData[field]) {
          return field + '=null' ;
        } else if (typeof entityData[field] === 'undefined'
          || entityData[field] === null
          || typeof entityData[field].id === 'undefined'
          || fields[field].id !== entityData[field].id.toString()) {
          if (fields[field] && fields[field].id) {
            return field + '=' + fields[field].id;
          } else {
            return field + '=' + JSON.stringify(fields[field]);
          }
        }
      } else if (fields[field] != entityData[field]) {
        if (schema[field].type === 'date') {
          return field + '=' + new Date(fields[field])
            .toLocaleString()
            .slice(0, -3)
            .replace(/,/g, '');
        }
        return field + '=' + fields[field];
      }
      return null;
    })
    .filter((field) => field !== null);
};

/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const Entity = require('./Entity.js');

const Common = {
  parsePlaceholders: (object, placeholders) => {
    if (typeof object == 'string') {
      let placeholdersMatch = object.match(/{\$([\d\w\-+_.]+)}/ig);

      if (!placeholdersMatch) {
        return object;
      }

      if (placeholdersMatch.length == 1 && object.length == placeholdersMatch[0].length) {
        return Common.getMatchValue(placeholdersMatch[0].replace(/[${}]/g, ''), placeholders);
      }

      return object.replace(/{\$([\d\w\-+_.]+)}/ig,
        (ph, name) => Common.getMatchValue(name, placeholders) ? Common.getMatchValue(name, placeholders) : '');
    }

    if (Array.isArray(object)) {
      return object.map((o) => Common.parsePlaceholders(o, placeholders));
    }

    if (typeof object == 'object') {
      let newObject = {};

      for (let i in object) {
        let n = Common.parsePlaceholders(i, placeholders);
        newObject[n] = Common.parsePlaceholders(object[i], placeholders);
      }

      return newObject;
    }
    if (typeof object == 'boolean') {
      return object;
    }

    if (typeof object == 'number') {
      return object;
    }
  },

  getMatchValue: (name, object) => {
    let path = Array.isArray(name) ? name : name.split('.');

    name = path.shift();

    if (path.length && object) {
      return Common.getMatchValue(path, object[name]);
    }

    return object ? object[name] : undefined;
  },

  applyEntity: (options, req, application) => {
    application = application || req.application;
    if (application.constructor.name == 'Application') {
      application = application.id;
    }

    return Entity.get(options.entity, application)
      .then((ent) => {
        switch (ent.type) {
          case 'Service':
            return ent.setData(req.body).request(options.route, req);
            break;

          case 'Script':
            return ent.setData(req.body, req).run();
            break;
        }
      });
  },
};

module.exports = Common;

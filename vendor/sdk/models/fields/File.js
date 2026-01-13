/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');
const request = require('request');
const mongoose = require('mongoose');
const fs = require('fs');
const ch = require('child_process');
const uuidv4 = require('uuid/v4');

const Config = require('../Config')();
const AFError = require('../Error');

const FileField = {
  validate: (field, value) => {
    return co(function* () {
      if (!value) {
        return null;
      }

      if (!field.source && typeof value != 'object') {
        return null;
      }

      if (value.id || (value.originalname && value.path)) {
        return value;
      }

      if (!field.source) {
        return FileField.saveFile(value);
      }

      switch (field.source) {
        case 'local':
          return FileField.saveFile(value);

        case 'instagram':
          return typeof value == 'string' ? value : null;

        default:
          return null;
      }
    });
  },

  get: (field, value) => {
    if (!field.source) {
      return value;
    }

    switch (field.source) {
      case 'local':
        return value;

      case 'instagram':
        return FileField.getFromInstagram(value)
          .then((images) => images.map((v) => {
            return {
              type: v.type,
              path: v.images.standard_resolution,
              images: v.images,
              videos: v.videos,
            };
          }));

      default:
        return null;
    }
  },

  saveFile: (value) => {
    return new Promise((resolve, reject) => {
      let file = {};
      if (!value.size || !value.name) {
        return reject(new AFError(400, 'Empty file buffer'));
      }

      value.id = mongoose.Types.ObjectId.createPk();

      let dir = Config.filestorage.root + Config.filestorage.location;
      let match = value.name.match(/\.[^\.]*$/);
      let extention = match && match[0] || '';
      let filename = value.id + '_' + uuidv4() + extention;

      file.path = '/' + Config.filestorage.location + filename;
      file.mimetype = value.type;
      file.originalname = value.name;
      file.size = value.size;

      ch.exec(`mkdir -p ${dir}`, () => {
        ch.exec(`cp ${value.path} ${dir}${filename}`, (err) => {
          err ? reject(err) : resolve(file);
        });
      });
    });
  },

  getFromInstagram: (token, maxId) => {
    let selfurl = 'https://api.instagram.com/v1/users/self/?access_token=' + token;

    return new Promise((resolve, reject) => {
      request(selfurl, (err, res, body) => {
        if (err) { return reject(err); }

        let data = JSON.parse(body);

        let mediaurl = 'https://www.instagram.com/' + data.data.username + '/media/';

        if (maxId) {
          mediaurl += '?max_id=' + maxId;
        }

        request(mediaurl, (err, res, body) => {
          if (err) { return reject(err); }

          let data = {items: []};

          try {
            data = JSON.parse(body);
          } catch (e) {
            data = {items: []};
          }
          resolve(data);
        });
      });
    })
      .then((data) => {
        let images = data.items;

        if (data.more_available) {
          return FileField.getFromInstagram(token, images[images.length - 1].id)
            .then((imgs) => images.concat(imgs));
        }

        return images;
      });
  },
};

module.exports = FileField;

'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.post('/set_adult_trigger',
  {appId: true},
  function* () {
    if (data.type == 'create') {
      data.data.categories.every((category) => {
        if (category.is_adult === true) {
          let updateData = {is_adult: true};
          data.newData = Object.assign(data.newData, updateData);
          return false;
        } else {
          let updateData = {is_adult: false};
          data.newData = Object.assign(data.newData, updateData);
        }
      });
    }

    return done();
  });

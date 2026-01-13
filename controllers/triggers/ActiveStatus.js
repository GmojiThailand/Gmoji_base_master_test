'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.use('/active_status_trigger',
  {appId: true},
  function* () {
    if (data.type == 'create') {
      const activeStatus = '598d9bac47217f28ba69e0f5';

      let updateData = {status: activeStatus};

      data.newData = Object.assign(data.newData, updateData);
    }

    return done();
  });

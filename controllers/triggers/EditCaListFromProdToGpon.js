'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.use('/edit_ca_list_from_prod_to_gpon_trigger',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    if (data.type == 'update') {
      const appId = '587640c995ed3c0c59b14600';
      const activeStatus = '598d9bac47217f28ba69e0f5';

      // проверять если изменился массив user_id то в сертификаты пихать новый
      if (data.newData.user_id && data.newData.user_id.length > 0) {
        if (data.newData.user_id.length > data.data.user_id.length) {
          for (let i = 0; i < data.newData.user_id.length; i++) {
            if (!~data.data.user_id.indexOf(data.newData.user_id[i])) {
              const certificatesTable = yield Table.fetch('certificates', appId);

              yield certificatesTable.updateMany({
                  status: activeStatus,
                  product: data.data.id,
                },
                {user_id: data.newData.user_id});

              break;
            }
          }
        } else {
          for (let i = 0; i < data.data.user_id.length; i++) {
            if (!~data.newData.user_id.indexOf(data.data.user_id[i])) {
              const certificatesTable = yield Table.fetch('certificates', appId);

              yield certificatesTable.updateMany({
                  status: activeStatus, product: data.data.id,
                },
                {user_id: data.newData.user_id});

              break;
            }
          }
        }
      }
    }

    return done();
  });

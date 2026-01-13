'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.use('/trying_cashing_history_update_trigger',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    const adminRole = '58808abccf1f550f22a8c02a';
    const banRole = '59c34d2851ddea023696f860';
    const contragentRole = '58860d1bc6887053b5978bb3';
    const subcontragentRole = '5988108288955d4a0dc7d644';

    let notifyService = yield Service.fetch('notify', this.application.id);

    let contragent;
    let subcontragent;

    if (data.newData.attempts > 5 && this.user.role.id != adminRole) {
      const userSys = yield User.find({id: this.user.id}, {}, this.application.id);

      if (!userSys) {throw new HttpError(404, 'User not found');}

      userSys.role = banRole;
      yield userSys.save();

      let sendObj = {
        date: new Date(),
        email: 'notifications@gmoji.world',
        reason: 'Попытка активировать джипон более 5 раз!',
      };

      if (this.user.role.id == contragentRole) {
        const contragentsTable = yield Table.fetch('contragents', this.application.id);
        contragent = yield contragentsTable.find({user_id: this.user.id})
          .catch((e) => (console.error(e), {data: null}));

        notifyService.data = Object.assign({
          reason: sendObj.reason,
          contragent: contragent.data.name,
          date: sendObj.date,
          email: [{email: sendObj.email}],
        });
      }

      if (this.user.role.id == subcontragentRole) {
        const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
        subcontragent = yield subcontragentsTable.find({user_id: this.user.id}, {populate: 'contragent_id'})
          .catch((e) => (console.error(e), {data: null}));

        notifyService.data = Object.assign({
          reason: sendObj.reason,
          contragent: subcontragent.data.contragent_id.name,
          date: sendObj.date,
          email: [{email: sendObj.email}],
        });
      }

      yield notifyService.request('gpon_activating_ban', this).catch((err) => done(err));
    }
  });

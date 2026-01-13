'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDisctionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const User = require('../models/User');

const router = new Router();

// когда изменится принцип владения джипоном
// нужно будет проверять перед удалением не только покупатель ли он,
// но и владелец ли
router.all('/soft_delete_user',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {userId} = this.request.fields || this.request.query;

    if (!userId) { throw new HttpError(400, 'Bad request'); }

    const certificatesTable = yield Table.fetch('certificates', this.application.id);
    let activeGpon = yield certificatesTable.find({status: StatusesDictionary.ACTIVE, buyer_id: userId})
      .catch((e) => ({data: null}));

    if (activeGpon.data) { throw new HttpError(403, 'User has active gpons'); }


    let userSys = yield User.find({id: userId, role: RolesDisctionary.USER}, {}, this.application.id);
    if (!userSys) { throw new HttpError(404, 'SysUser not found'); }
    userSys.role = RolesDisctionary.BAN;

    const usersTable = yield Table.fetch('users', this.application.id);
    let user = yield usersTable.find({user_id: userId}).catch((e) => ({data: null}));
    if (!user.data) { throw new HttpError(404, 'User not found'); }

    yield userSys.save();
    let result = yield user.data.update({status: StatusesDictionary.DELETED});

    this.body = result;
  });

// нет в базе рулов
  router.post('/restore_user',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {userId} = this.request.fields;


    if (!userId) { throw new HttpError(400, 'Bad request'); }

    let userSys = yield User.find({id: userId, role: RolesDisctionary.BAN}, {}, this.application.id);
    if (!userSys) { throw new HttpError(404, 'SysUser not found'); }
    userSys.role = RolesDisctionary.USER;

    const usersTable = yield Table.fetch('users', this.application.id);
    let user = yield usersTable.find({user_id: userId}).catch((e) => ({data: null}));
    if (!user.data) { throw new HttpError(404, 'User not found'); }

    yield userSys.save();
    let result = yield user.data.update({status: StatusesDictionary.ACTIVE});

    this.body = result;
  });

module.exports = router;

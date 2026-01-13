'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const Table = require('../models/Table');
const User = require('../models/User');
const Service = require('../models/Service');

const utils = require('../models/utils');

const router = new Router();

/**
 * Один роут на создание админов
 *  username - почта
 *  password - генерится
 *  role - id роли
 */
router.post('/create_admin',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let {username, fullname, role} = this.request.fields;
    username = username.toLowerCase().trim();

    if (!fullname || !username) {
      throw new HttpError(400, 'Name or username required');
    }

    if (role != RolesDictionary.ADMIN_SECOND && role != RolesDictionary.ADMIN_FIRST) {
      throw new HttpError(400, 'Invalid role');
    }

    try {
      yield utils.checkUniqueParams(this.application, {username});
    } catch (error) {
      throw new HttpError(400, 'Email is not unique');
    }

    let password = utils.passwordGenerator();
    let userSys = new User({username, role, type: 'oauth'}, this.application.id);
    userSys.password = password;
    yield userSys.save();

    let adminData = {
      fullname,
      user_id: userSys.id,
      status: StatusesDictionary.ACTIVE,
    };
    const adminsTable = yield Table.fetch('administrators', this.application.id);
    let admin = yield adminsTable.create(adminData);

    //  Отсылка на почту
    let notify = yield Service.fetch('notify', this.application.id);
    notify.data = {password, email: [{email: userSys.username}]};
    try {
      yield notify.request('password_gen', this);
    } catch (err) {
      console.error(err);
    }


    let result = {
      id: userSys.id,
      username: userSys.username,
      fullname: admin.fullname,
      role: userSys.role,
      status: admin.status,
    };
    this.body = result;
  });

/**
 * Редактирование админа
 * @email
 */
router.post('/edit_admin',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let result;
    let userSys;
    let admin;

    if (this.user.role.id == RolesDictionary.ADMIN_SUPER) {
      let {user_id, username, fullname, role, password} = this.request.fields;

      if (!user_id) throw new HttpError(400, 'Bad request');
      userSys = yield User.find({id: user_id}, {}, this.application.id);

      if (role || username || password) {
        if (!userSys) throw new HttpError(404, 'User not found');

        if (username) {
          username = username.toLowerCase().trim();
          userSys.username = username;
          try {
            yield utils.checkUniqueParams(this.application, {username});
          } catch (error) {
            throw new HttpError(400, 'Email is not unique');
          }
        }
        if (role) { userSys.role = role; }

        if (password) {
          userSys.password = password;
        }

        yield userSys.save();
      }

      const administratorsTable = yield Table.fetch('administrators', this.application.id);
      if (fullname) {
        admin = yield administratorsTable.findOneAndUpdate({user_id}, {fullname}, {new: true})
          .catch((e) => ({data: null}));
      } else {
        admin = yield administratorsTable.find({user_id})
          .catch((e) => ({data: null}));
      }

      if (!admin || !admin.data) { throw new HttpError(404, 'Admin not found'); }

      result = Object.assign(
        {},
        {
          username: userSys.username,
          fullname: admin.data.fullname,
          role: userSys.role,
          user_id: admin.data.user_id,
        }
      );
    } else {
      let {password} = this.request.fields;
      let userSys = yield User.find({id: this.user.id}, {}, this.application.id);
      userSys.password = password;
      yield userSys.save();

      result = 'Password changed';
    }


    this.body = result;
  });

/**
 * вывод списка админов
 * @email
 */
router.post('/get_admin_list',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const adminRoles = [RolesDictionary.ADMIN_FIRST, RolesDictionary.ADMIN_SECOND, RolesDictionary.BAN];

    let usersSys = yield User.findAll({role: {$in: adminRoles}}, {populate: 'role'}, this.application.id);
    let userIds = usersSys.map((u) => u.id.toString());

    const administratorsTable = yield Table.fetch('administrators', this.application.id);
    let administrators = yield administratorsTable.findAll({user_id: {$in: userIds}});

    let result = administrators.data.map((adm) => {
      usersSys.map((us) => {
        delete us.self.role.permissions;
        if (us.id == adm.user_id) {
          adm.username = us.self.username;
          adm.role = us.self.role;
        }
      });
      return adm;
    });


    this.body = result;
  });

/**
 * Вывод профиля админов
 */
router.all('/get_admin',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.user_id) { throw new HttpError(400, 'User id required'); }

    const adminRoles = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_FIRST, RolesDictionary.ADMIN_SECOND];

    let userSys = yield User.find(
      {
        id: fields.user_id,
        role: {$in: adminRoles},
      },
      {},
      this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    const administratorsTable = yield Table.fetch('administrators', this.application.id);
    let administrator = yield administratorsTable.find({user_id: userSys.id.toString()})
      .catch((e) => ({data: null}));
    administrator = administrator.data;

    if (!administrator) { throw new HttpError(404, 'Administrator not found'); }

    let result = {
      id: userSys.id.toString(),
      username: userSys.username,
      role: userSys.role,
      fullname: administrator.fullname,
      status: administrator.status,
    };

    this.body = result;
  });


/**
 * @param id - id забаненного админа
 */
router.post('/ban_admin',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    const adminRoles = [RolesDictionary.ADMIN_FIRST, RolesDictionary.ADMIN_SECOND];
    if (!id) throw new HttpError(400, 'Bad request');

    let userSys = yield User.find({id, role: {$in: adminRoles}}, {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    userSys.role = RolesDictionary.BAN;
    yield userSys.save();

    const administratorsTable = yield Table.fetch('administrators', this.application.id);
    let admin = yield administratorsTable.find({user_id: id})
      .catch((e) => ({data: null}));

    if (!admin || !admin.data) { throw new HttpError(404, 'Admin not found'); }

    yield admin.data.update({status: StatusesDictionary.DELETED});

    let result = {
      id: userSys.id,
      username: userSys.username,
      fullname: admin.data.fullname,
      role: userSys.role,
      status: admin.data.status,
    };

    this.body = result;
  });


router.post('/unban_admin',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id, role} = this.request.fields;

    if (!id || !role) throw new HttpError(400, 'Incorrect request fields');

    if (role && role !== RolesDictionary.ADMIN_FIRST && role !== RolesDictionary.ADMIN_SECOND) {
      throw new HttpError(400, 'Invalid role');
    }

    let userSys = yield User.find({id, role: RolesDictionary.BAN}, {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    userSys.role = role;
    yield userSys.save();

    const administratorsTable = yield Table.fetch('administrators', this.application.id);
    let admin = yield administratorsTable.find({user_id: id})
      .catch((e) => ({data: null}));

    yield admin.data.update({status: StatusesDictionary.ACTIVE});

    if (!admin || !admin.data) { throw new HttpError(404, 'Admin not found'); }

    let result = {
      id: userSys.id,
      username: userSys.username,
      fullname: admin.data.fullname,
      role: userSys.role,
      status: admin.data.status,
    };

    this.body = result;
  });


module.exports = router;

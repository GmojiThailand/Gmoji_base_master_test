'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const Role = require('../models/Role');
const translate = require('cyrillic-to-translit-js');
const utils = require('../models/utils');
const RolesDictionary = require('../models/dictionaries/Role');

const router = new Router();

/**
 * Просмотр списком существующие роли
 * для супер администратора
 */
router.get('/list_role',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let roles = yield Role.findAll({}, {}, this.application.id);
    roles = roles.map((r) => {
      delete r.self.permissions;
      return r.self;
    });
    this.body = roles;
  });

router.get('/get_role',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.query;
    const rulesTable = yield Table.fetch('rules', this.application.id);
    let rules = yield rulesTable.findAll({is_editable: true});
    rules = rules.data.map((r) => {
      delete r.route;
      delete r.is_editable;
      r.role.includes(id) ? r.enabled = true : r.enabled = false;
      delete r.role;
      return r;
    });
    this.body = rules;
  });

/**
 *  permissions: {
 *  enable: [
 *  id, id, id
 * ],
 * disable: [
 *  id, id, id
 * ]
 * }
 */
router.post('/edit_role',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let result = {};
    const {id, name: name_ru, permissions} = this.request.fields;
    const defaultRoles = [RolesDictionary.ADMIN_SUPER, RolesDictionary.BAN];
    if (!id) throw new HttpError(400, 'Bad request');

    if (defaultRoles.includes(id)) throw new HttpError(400, 'No editing default roles');

    if (name_ru) {
      let role = yield Role.find({name_ru}, {}, this.application.id).catch((e) => null);
      if (role) throw new HttpError(400, 'Name is already exists');
      role = yield Role.find({id}, {}, this.application.id);
      role.name_ru = name_ru;
       role.name = translate().transform(name_ru, '_');
      yield role.save();
      Object.assign(result, role.self);
    }
    if (permissions) {
      const rulesTable = yield Table.fetch('rules', this.application.id);
      try {
        permissions.enable.length > 0 ? yield rulesTable.updateMany({is_editable: true, id: {$in: permissions.enabled}}, {$push: {role: id}}) : null;
        permissions.disable.length > 0 ? yield rulesTable.updateMany({is_editable: true, id: {$in: permissions.disable}}, {$pull: {role: id}}) : null;

        let rules = yield rulesTable.findAll({is_editable: true});
        rules = rules.data.map((r) => {
          delete r.route;
          delete r.is_editable;
          r.role.includes(id) ? r.enabled = true : r.enabled = false;
          delete r.role;
          return r;
        });
        Object.assign(result, rules);
      } catch (e) {
        throw new HttpError(500, 'Database error');
      }
    }
    this.body = result;
  });

/**
 *выполняется проверка - нельзя удалить роль,
 если на неё назначен пользователь, выводится сообщение с предупреждением
 */
router.post('/delete_role',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    const defaultRoles = [
      RolesDictionary.ADMIN_SUPER,
      RolesDictionary.BAN,
      RolesDictionary.CONTRAGENT,
      RolesDictionary.SUB_CONTRAGENT,
      RolesDictionary.USER,
    ];
    if (defaultRoles.includes(id)) throw new HttpError(400, 'Cant delete role');
    let userSys = yield User.findAll({role: id}, {}, this.application.id);
    if (userSys.length > 0) throw new HttpError(400, 'User has role');
    let role = yield Role.find({id}, {}, this.application.id);
    yield role.remove();
    this.body = 'Ok';
  });


/**
 *  name_ru - название роли
 * permissions - id пермишенов из таблицы rules
 */
router.post('/create_role',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let {name_ru, permissions} = this.request.fields;
    if (!name_ru || !permissions) throw new HttpError(400, 'Bad request');
    name_ru = name_ru.toString().trim();
    permissions = permissions.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const name = translate().transform(name_ru, '_');
    let role = new Role({name, name_ru}, this.application.id);
    yield role.save();
    const rulesTable = yield Table.fetch('rules', this.application.id);
    yield rulesTable.updateMany({id: {$in: permissions}}, {$push: {role: role.self.id}});
    this.body = role.self;
  });

/**
 * permissions - id permissions из таблицы rules
 */
router.post('/check_same_role',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {permissions} = this.request.fields;
    if (!permissions) throw new HttpError(400, 'Bad request');
    const rulesTable = yield Table.fetch('rules', this.application.id);
    let rules = yield rulesTable.findAll({id: permissions});

    let roles = [];
    rules.data.map((r) => {
      roles = roles.concat(r.role);
    });

    let counter = roles.reduce((acc, curr) => {
      if (typeof acc[curr] == 'undefined') {
        acc[curr] = 1;
      } else {
        acc[curr] += 1;
      }
      return acc;
    }, {});

    let result = null;
    Object.keys(counter).map((k) => {
      if (counter[k] === rules.data.length) {
        result = k;
      }
    });
    if (result !== null) {
      result = yield Role.find({id: result}, {}, this.application.id);
      delete result.self.permissions;
    }
    this.body = result ? result.self : null;
  });

module.exports = router;

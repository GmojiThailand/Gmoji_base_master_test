/**
 * Редактирование контрагента
 *
 * Если запуск скрипта идет от админа то нужно отправить доп.параметр
 * @param {string} user_id - системный id контрагента
 * @param {string} email - новый логин/почта контрагента
 * @param {string} name - новое имя контрагента
 *
 * @throws - 400, Password field is empty
 * @throws - 404, User not found
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const User = require('../models/User');
const Service = require('../models/Service');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');
const AccessToken = require('../models/SystemTokens/AccessToken');

const utils = require('../models/utils');

const router = new Router();

router.all('/edit_ca',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    // Check if user exists
    if (!this.user) { throw new HttpError(401, 'User not authenticated'); }
    
    // Always fetch user with role populated to ensure we have the role
    let userWithRole = null;
    if (this.user.id) {
      try {
        userWithRole = yield User.find({id: this.user.id}, {populate: 'role'}, this.application.id);
        if (userWithRole) {
          // Update this.user with populated role
          this.user.role = userWithRole.role;
        }
      } catch (err) {
        console.error('EditCa - Error fetching user with role:', err);
      }
    }
    
    // Get user role ID - handle both object and string formats
    let userRoleId = null;
    
    // Try multiple ways to get role ID
    const roleValue = this.user.role || (userWithRole && userWithRole.role) || (this.user.self && this.user.self.role);
    
    if (roleValue) {
      if (typeof roleValue === 'string') {
        userRoleId = roleValue;
      } else if (roleValue.id) {
        userRoleId = roleValue.id.toString ? roleValue.id.toString() : String(roleValue.id);
      } else if (roleValue.toString && typeof roleValue.toString === 'function') {
        userRoleId = roleValue.toString();
      } else if (roleValue._id) {
        userRoleId = roleValue._id.toString ? roleValue._id.toString() : String(roleValue._id);
      }
    }
    
    if (!userRoleId) { 
      console.error('EditCa - User role not found');
      console.error('EditCa - user.id:', this.user.id);
      console.error('EditCa - this.user.role:', this.user.role);
      console.error('EditCa - userWithRole:', userWithRole ? 'found' : 'not found');
      throw new HttpError(403, 'User role not found'); 
    }

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND];
    let isAdmin = ~admins.indexOf(userRoleId);
    let isSubcontragent = userRoleId == RolesDictionary.SUB_CONTRAGENT;

    let contragentFilter = {role: RolesDictionary.CONTRAGENT};
    if (userRoleId == RolesDictionary.CONTRAGENT) {
      contragentFilter.id = this.user.id;
    } else if (isSubcontragent) {
      // Subcontragent can only edit their own contragent
      const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
      const subcontragent = yield subcontragentsTable.find({user_id: this.user.id.toString()})
        .catch((e) => ({data: null}));
      
      if (!subcontragent || !subcontragent.data) {
        throw new HttpError(404, 'Subcontragent not found');
      }
      
      contragentFilter.id = subcontragent.data.contragent_id;
    }

    if (isAdmin) {
      if (!fields.user_id) { throw new HttpError(400, 'User ID required for admin edit'); }
      contragentFilter.id = fields.user_id;
    }

    let userSys = yield User.find(contragentFilter, {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    if (fields.email || fields.name) {
      try {
        yield utils.checkUniqueParams(this.application, {username: fields.email, name: fields.name, role: 'contragents'});
      } catch (error) {
        throw new HttpError(400, 'Contragent is not unique');
      }
    }

    let contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragent = yield contragentsTable.find({user_id: userSys.id.toString()})
      .catch((e) => ({data: null}));

    if (!contragent || !contragent.data) { throw new HttpError(404, 'Contragent not found'); }

    let updatedFields = [];

    if (fields.email) {
      const emailTokensTable = yield Table.fetch('email_verification_tokens', this.application.id);
      const newEmail = fields.email;

      if (isAdmin) {
        userSys.username = fields.email;
        yield userSys.save();

        // Удаление токенов верификации по данному email(операция смены через роль администратора приоритетнее)
        yield emailTokensTable.updateMany(
          {
            $or: [
              {email: fields.email},
              {user_id: userSys.id.toString()},
            ],
            status: StatusesDictionary.ACTIVE,
          },
          {
            status: StatusesDictionary.DELETED,
          }
        );

        // Удаление токенов авторизации КА, чтобы у него произошел logout
        const accessToken = new AccessToken();
        yield accessToken.remove({userId: userSys.id.toString()});
      } else {
        const salt = 'AFGmojiMP';
        const key = Math.round(Math.random() * (999999 - 129899) + 129899).toString();
        let sugar = [];

        for (let i = 0; i < key.length; i++) {
          sugar.push(salt[parseInt(key[i])]);
        }
        sugar = sugar.join();

        let token = Buffer.from(sugar).toString('base64');

        // Создание токена верификации и отправка ссылки для верификации на новый email КА
        yield emailTokensTable.updateMany(
          {
            user_id: userSys.id.toString(),
            status: StatusesDictionary.ACTIVE,
          },
          {
            status: StatusesDictionary.DELETED,
          }
        );

        yield emailTokensTable.create({
          user_id: userSys.id.toString(),
          email: fields.email,
          token,
          expiration_date: Date.now() + 1000 * 60 * 60 * 24,
          status: StatusesDictionary.ACTIVE,
        });

        let verification_link = 'http://' + process.env.URL +
                                '/api/v1/email_verification?t=' + encodeURIComponent(token);

        // Try to send notification, but don't fail if service is unavailable
        try {
          let notify = yield Service.fetch('notify', this.application.id);
          notify.data = {verification_link, email: [{email: fields.email}]};
          yield notify.request('email_verify', this);
        } catch (err) {
          console.error('Failed to send email verification notification:', err);
          // Continue execution even if notification fails
        }

        delete fields.email;
      }

      updatedFields.push('email=' + newEmail);
    }

    contragent.data = yield contragent.data.update(fields);

    // Try to create admin log, but don't fail if it's not possible
    try {
      let logOptions = {
        operationType: AdminLogData.LOG_OPERATION.UPDATE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.CONTRAGENT,
        entityId: contragent.data.id,
        updatedFields: updatedFields.concat(yield utils.getUpdatedFields(contragent.data, fields, contragentsTable.db.schema)),
      };
      yield utils.createAdminLog(this.application, logOptions);
    } catch (err) {
      console.error('Failed to create admin log:', err);
      // Continue execution even if admin log fails
    }

    this.body = {data: {contragent: contragent.data}};
  });

module.exports = router;

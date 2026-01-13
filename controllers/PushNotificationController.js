'use strict';
const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.post('/add_push',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
      const {type, token} = this.request.fields;
      if (!token) throw new HttpError(400, 'Bad request');
      if (type !== 'ios' && type !== 'android' && type !== 'gaid' && type !== 'idfa') throw new HttpError(400, 'Bad request');

      const usersTable = yield Table.fetch('users', this.application.id);
      let res = yield usersTable.find({user_id: this.user.id, status: StatusesDictionary.ACTIVE})
          .catch((err) => ({data: null}));

      let pullObj = [];
      if (res && res.data && res.data.push_tokens && res.data.push_tokens[type]) {
          pullObj = res.data.push_tokens[type];
      }
      if (pullObj.indexOf(token) < 0) {
          pullObj.push(token);
      }
      pullObj = pullObj.slice(-5);

      let update = {};
      update[`push_tokens.${type}`] = pullObj;

      res = yield usersTable.findOneAndUpdate({user_id: this.user.id, status: StatusesDictionary.ACTIVE}, update, {new: true})
          .catch((err) => ({data: null}));

      if (!res || !res.data) {
          this.body = [];
      } else {
          this.body = res.data.push_tokens;
      }
  });

router.get('/get_push',
  {
    appId: true,
  },
  function* () {
    const {user_id} = this.request.query;
    const usersTable = yield Table.fetch('users', this.application.id);
    let params = {};
    if (user_id) {
      params.user_id = user_id;
    }
    let users = yield usersTable.findAll(params, {select: 'push_tokens'});
    let push = users.data.map((u) => u.push_tokens);
    this.body = push;
  });


module.exports = router;

'use strict';

let roles = getRoles();

function checkIsPromotedAdmin(userId) {
  const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND];

  return ~admins.indexOf(userId.toString()) ? true : false;
}

function checkIsAdmin(userId) {
  const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

  return ~admins.indexOf(userId.toString()) ? true : false;
}

function getRoles(string) {
  return {
    ADMIN_SUPER: '58808abccf1f550f22a8c02a',
    ADMIN_FIRST: '589732e094431f63462f88b0',
    ADMIN_SECOND: '5a6c6259687aff073c580af3',
    USER: '58b40f669154c320f9831bfa',
    CONTRAGENT: '58860d1bc6887053b5978bb3',
    BAN: '59c34d2851ddea023696f860',
    SUB_CONTRAGENT: '5988108288955d4a0dc7d644',
  };
};

Object.assign(
  roles,
  {
    checkIsPromotedAdmin: checkIsPromotedAdmin,
    checkIsAdmin: checkIsAdmin,
  }
);

module.exports = roles;

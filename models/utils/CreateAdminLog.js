'use strict';

const Table = require('../Table');
const User = require('../User');

/**
 * entityType - тип сущности действия над которой логируем
 * entityId - ид экземпляра сущности
 * operationType - тип операции CRUD
 * user_id - кто сделал эту операцию
 */

exports.exec = function* (application, {operationType, userId, tableName, entityId, updatedFields} = options) {
  const administrationLogsTable = yield Table.fetch('administration_logs', application.id);

  let user = yield User.find({_id: userId}, {}, application.id);

  let data = {
    operation_type: operationType,
    user_id: user.username,
    table_name: tableName,
    entity_id: entityId,
    updated_fields: updatedFields,
  };
  let log = yield administrationLogsTable.create(data);

  return {data: log};
};

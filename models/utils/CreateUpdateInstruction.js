'use strict';

const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');


exports.exec = function* (application, method, description, id) {
  const productInstructionsTable = yield Table.fetch('product_instructions', application.id);
  let instruction;
  if (method === 'update' && id) {
    instruction = yield productInstructionsTable.findOneAndUpdate({id}, {description}, {new: true});
    instruction = instruction.data || instruction;
  } else {
    instruction = yield productInstructionsTable.create({description, status: StatusesDictionary.ACTIVE});
  }
  return instruction;
};

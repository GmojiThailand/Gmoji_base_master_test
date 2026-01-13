db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.targets': {
      'type': 'string',
      'name': 'targets',
      'array': true
    }
  }
});

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.targets': {
      'type': 'string',
      'name': 'targets',
      'array': true
    }
  }
});

db.tableentity_587641dd95ed3c0c59b14604.update({}, {$set: {targets: ['app', 'gb']}}, {multi: true});
db.tableentity_58973d924802c138d75d91e6.update({}, {$set: {targets: ['app', 'gb']}}, {multi: true});

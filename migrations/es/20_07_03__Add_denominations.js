db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.use_denominations': {
      'type': 'boolean',
      'name': 'use_denominations'
    },
    'options.fields.denomination_parent': {
      'type': 'referer',
      'name': 'denomination_parent',
      'ref': '58973d924802c138d75d91e6',
      'populate': false,
    }
  }
});

db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.localized_name': {
      'type': 'object',
      'name': 'localized_name'
    }
  }
});

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.localized_name': {
      'type': 'object',
      'name': 'localized_name'
    },
    'options.fields.name': {
      'type': 'string',
      'name': 'name'
    }
  }
});
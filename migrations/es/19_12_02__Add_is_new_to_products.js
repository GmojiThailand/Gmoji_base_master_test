db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.is_new': {
      'type': 'boolean',
      'name': 'is_new'
    }
  }
});

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.is_new': {
      'type': 'boolean',
      'name': 'is_new'
    }
  }
});
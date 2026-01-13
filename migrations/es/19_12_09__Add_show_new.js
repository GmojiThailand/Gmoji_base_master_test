db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.show_new': {
      'type': 'number',
      'name': 'show_new'
    }
  }
});

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.show_new': {
      'type': 'number',
      'name': 'show_new'
    },
    'options.fields.lazy_integration': {
      'type': 'boolean',
      'name': 'lazy_integration'
    }
  }
});
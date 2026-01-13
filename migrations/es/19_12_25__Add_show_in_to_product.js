db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.show_in_app': {
      'type': 'boolean',
      'name': 'show_in_app'
    },
    'options.fields.show_in_gb': {
      'type': 'boolean',
      'name': 'show_in_gb'
    }
  }
});

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.show_in_app': {
      'type': 'boolean',
      'name': 'show_in_app'
    },
    'options.fields.show_in_gb': {
      'type': 'boolean',
      'name': 'show_in_gb'
    }
  }
});

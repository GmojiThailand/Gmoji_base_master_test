db = connect('localhost:27017/api-factory');

db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Скрыть/показать категорию',
    'route': '/hide_category',
    'role': ['58808abccf1f550f22a8c02a'],
    'is_editable': false,
    'is_real': true
  }
);

db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Скрыть/показать категорию',
    'route': '/hide_product',
    'role': ['58808abccf1f550f22a8c02a'],
    'is_editable': false,
    'is_real': true
  }
);

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.hidden': {
      'type': 'boolean',
      'name': 'hidden'
    }
  }
});

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.hidden': {
      'type': 'boolean',
      'name': 'hidden'
    }
  }
});
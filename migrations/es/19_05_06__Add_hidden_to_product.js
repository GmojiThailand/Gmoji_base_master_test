db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.vending_id': {
      'type': 'string',
      'name': 'vending_id'
    }
  }
});

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.old_price': {
      'type': 'number',
      'name': 'old_price'
    }
  }
});

db.entities.update({'name': 'product_categories'}, {
  $set: {
    'options.fields.new': {
      'type': 'boolean',
      'name': 'new'
    }
  }
});

db.entities.update({'name': 'certificate_owning_history'}, {
  $set: {
    'options.fields.hidden': {
      'type': 'boolean',
      'name': 'hidden'
    }
  }
});
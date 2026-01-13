db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'subway_station'}, {
  $set: {
    'options.fields.localized_name': {
      'type': 'object',
      'name': 'localized_name'
    }
  }
});

db.entities.update({'name': 'stores'}, {
  $set: {
    'options.fields.localized_working_hours': {
      'type': 'object',
      'name': 'localized_working_hours'
    },
    'options.fields.localized_category': {
      'type': 'object',
      'name': 'localized_category'
    }
  }
});

db.entities.update({'name': 'contragents'}, {
  $set: {
    'options.fields.localized_name': {
      'type': 'object',
      'name': 'localized_name'
    }
  }
});

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.localized_short_description': {
      'type': 'object',
      'name': 'localized_short_description'
    }
  }
});
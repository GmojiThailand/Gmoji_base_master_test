db = connect('localhost:27017/api-factory');

db.entities.save(
  {
    '_id': ObjectId('5ca35171d20328aa37c21075'),
    'name': 'locale',
    'type': 'Table',
    'options': {
      'triggers': [],
      'params': {'timestamps': true},
      'rules': {
        'public': {'access': []},
        'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
      },
      'fields': {
        'name': {
          'type': 'string',
          'name': 'name'
        },
        'country': {
          'type': 'string',
          'name': 'country'
        },
        'code': {
          'type': 'string',
          'name': 'code'
        },
        'status': {
          'ref': '598d9a4747217f28ba69e0f3',
          'required': true,
          'populate': {'filter': '', 'select': []},
          'type': 'referer',
          'name': 'status'
        }
      },
      'adapter': 'MongoDB',
      'indexes': ''
    },
    'application': ObjectId('587640c995ed3c0c59b14600')
  }
);

db.entities.find({'name': 'locale'}).forEach(function (v) {
  db.createCollection('tableentity_' + v['_id'].str);
});

db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Создать локаль',
    'route': '/create_locale',
    'role': ['58808abccf1f550f22a8c02a'],
    'is_editable': false,
    'is_real': true
  }
);
db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Редактировать локаль',
    'route': '/edit_locale',
    'role': ['58808abccf1f550f22a8c02a'],
    'is_editable': false,
    'is_real': true
  }
);
db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Удалить локаль',
    'route': '/delete_locale',
    'role': ['58808abccf1f550f22a8c02a'],
    'is_editable': false,
    'is_real': true
  }
);
db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Получить локаль по id',
    'route': '/get_locale',
    'role': ['58808abccf1f550f22a8c02a', '58b40f669154c320f9831bfa'],
    'is_editable': false,
    'is_real': true
  }
);
db.tableentity_5a95044e265be107208275c9.save(
  {
    'description': 'Получить список локалей',
    'route': '/get_all_locales',
    'role': ['58808abccf1f550f22a8c02a', '58b40f669154c320f9831bfa'],
    'is_editable': false,
    'is_real': true
  }
);

db.entities.update({'name': 'products'}, {
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
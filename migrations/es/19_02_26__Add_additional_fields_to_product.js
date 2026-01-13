db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.measure': {
      'type': 'string',
      'name': 'measure'
    },
    'options.fields.value': {
      'type': 'string',
      'name': 'value'
    },
    'options.fields.isMultiPurchase': {
      'type': 'boolean',
      'name': 'isMultiPurchase'
    },
    'options.fields.isSendPhoto': {
      'type': 'boolean',
      'name': 'isSendPhoto'
    }
  }
});

db.entities.update({'name': 'product_contragent_cards'}, {
  $set: {
    'options.fields.photo': {
      'ref': '58b91e756521367de466f328',
      'populate': {
        'filter': '',
        'select': ['image']
      },
      'type': 'referer',
      'name': 'photo'
    },
    'options.fields.thumbnail': {
      'ref': '58b91e756521367de466f328',
      'populate': {
        'filter': '',
        'select': ['image']
      },
      'type': 'referer',
      'name': 'thumbnail'
    }
  }
});

db.entities.save(
  {
    '_id': ObjectId('5c7e1488dcc718e1e10a6129'),
    'name': 'product_photo',
    'type': 'Table',
    'options': {
      'triggers': [],
      'params': {'timestamps': true},
      'rules': {
        'public': {'access': []},
        'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
      },
      'fields': {
        'product_id': {
          'ref': '58973d924802c138d75d91e6',
          'required': true,
          'populate': false,
          'type': 'referer',
          'name': 'product_id'
        },
        'photo': {
          'ref': '58b91e756521367de466f328',
          'populate': {
            'filter': '',
            'select': ['image']
          },
          'type': 'referer',
          'name': 'photo'
        },
        'thumbnail': {
          'ref': '58b91e756521367de466f328',
          'populate': {
            'filter': '',
            'select': ['image']
          },
          'type': 'referer',
          'name': 'thumbnail'
        }
      },
      'adapter': 'MongoDB',
      'indexes': ''
    },
    'application': ObjectId('587640c995ed3c0c59b14600')
  }
);

db.entities.find({'name': 'product_photo'}).forEach(function (v) {
  db.createCollection('tableentity_' + v['_id'].str);
});

db.tableentity_5a95044e265be107208275c9.save({
  'description': 'Получить фото продукта',
  'route': '/get_product_photo',
  'role': ['58860d1bc6887053b5978bb3', '58b40f669154c320f9831bfa', '5a6c6259687aff073c580af3', '589732e094431f63462f88b0', '58808abccf1f550f22a8c02a'],
  'is_editable': false,
  'is_real': true
});
db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'contragents'}, {
  $set: {
    'options.fields.use_api_address': {
      'type': 'boolean',
      'name': 'use_api_address'
    }
  }
});

db.entities.update({'name': 'products'}, {
  $set: {
    'options.fields.short_description': {
      'type': 'string',
      'name': 'short_description'
    }
  }
});

db.entities.save(
    {
      '_id' : ObjectId("5d282ae6d0ec6e1f108d13fa"),
      'name': 'wallet',
      'type': 'Table',
      'options': {
        'triggers': [],
        'params': {'timestamps': true},
        'rules': {
          'public': {'access': []},
          'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
        },
        'fields': {
          "date": {
            "type": "date",
            "name": "date"
          },
          'certificate_id': {
            'type': 'string',
            'name': 'certificate_id'
          },
          'method': {
            'type': 'string',
            'name': 'method'
          },
          'partner': {
            'type': 'string',
            'name': 'partner'
          },
          'source': {
            'type': 'string',
            'name': 'source'
          },
          'transaction_id': {
            'type': 'string',
            'name': 'transaction_id'
          },
          'google_wallet_object_id': {
            'type': 'string',
            'name': 'google_wallet_object_id'
          },
          'apple_wallet_object_id': {
            'type': 'string',
            'name': 'apple_wallet_object_id'
          },
          'tokens': {
            'type': 'object',
            'name': 'tokens'
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

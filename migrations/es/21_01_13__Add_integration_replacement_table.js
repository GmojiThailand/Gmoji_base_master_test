db = connect('localhost:27017/api-factory');

db.entities.save(
  {
    '_id': ObjectId('5ffe8979335fce4b7e84ad96'),
    'name': 'integration_replacement',
    'type': 'Table',
    'options': {
      'triggers': [],
      'params': {'timestamps': true},
      'rules': {
        'public': {'access': []},
        'all': {'access': ['list', 'view'], 'filter': {'status': '598d9bac47217f28ba69e0f5'}}
      },
      'fields': {
        'product': {
          'ref': '58973d924802c138d75d91e6',
          'populate': true,
          'type': 'referer',
          'name': 'product'
        },
        'provider': {'type': 'string', 'name': 'provider'},
        'provider_service': {'type': 'string', 'name': 'provider_service'},
        'provider_amount': {'type': 'integer', 'name': 'provider_amount'},
        'commission_percent': {'type': 'double', 'name': 'commission_percent'}
      },
      'adapter': 'MongoDB',
      'indexes': ''
    },
    'application': ObjectId('587640c995ed3c0c59b14600')
  }
);
db.createCollection('tableentity_5ffe8979335fce4b7e84ad96');

db.simple_storage.find({code: 'replace_config'}).forEach(function(config) {
  for (var provider of ['csv', 'digift', 'giftery', 'epay', 'cft', 'tangocard']) {
    for (var product in config.value[provider]) {
      var providerRow = config.value[provider][product];
      if (providerRow) {
        var providerData = providerRow.split('==');
        if (providerData[1]) {
          db.tableentity_5ffe8979335fce4b7e84ad96.save(
            {
              'product': ObjectId(product),
              'provider': provider,
              'provider_service': providerData[0],
              'provider_amount': NumberInt(providerData[1])
            }
          );
        } else {
          db.tableentity_5ffe8979335fce4b7e84ad96.save(
            {
              'product': ObjectId(product),
              'provider': provider,
              'provider_service': providerData[0],
            }
          );
        }
      } else {
        db.tableentity_5ffe8979335fce4b7e84ad96.save(
          {
            'product': ObjectId(product),
            'provider': provider
          }
        );
      }
    }
  }
  for (var product in config.value.ozon) {
    db.tableentity_5ffe8979335fce4b7e84ad96.save(
      {
        'product': ObjectId(product),
        'provider': 'ozon',
        'provider_amount': NumberInt(config.value.ozon[product])
      }
    );
  }
});

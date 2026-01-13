db = connect('localhost:27017/api-factory');

db.simple_storage.find({code: 'replace_config'}).forEach(function(config) {
  for (var provider of ['csv', 'digift', 'giftery', 'epay', 'cft', 'tangocard']) {
    for (var product in config.value[provider]) {
      try {
        if (!db.tableentity_5ffe8979335fce4b7e84ad96.count({product: ObjectId(product)})) {
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
      } catch (exception) {
        print('Error on create integration replacement for product ' + product);
      }
    }
  }
});

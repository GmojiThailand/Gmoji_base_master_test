db = connect('localhost:27017/api-factory');

db.entities.find({'name': 'integration_replacement'}).forEach(function (v) {
  var integrationTable = 'tableentity_' + v['_id'].str;
  db[integrationTable].find().forEach(function(v) {
    if (v.commission_fixed) {
      db[integrationTable].update({_id: v._id}, {$set: {commission_fixed: v.commission_fixed * 100}});
    }
  });
});

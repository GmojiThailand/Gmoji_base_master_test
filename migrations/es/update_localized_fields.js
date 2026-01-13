db = connect('localhost:27017/api-factory');

tableQuery = {};
tableQuery['name'] = tableName;
query = {};
query[fieldName] = {$exists: true};

db.entities.find(tableQuery).forEach(function (e) {
  var table = 'tableentity_' + e['_id'].str;
  db[table].find(query).forEach(function (v) {
    var replaceValue = {};
    if (v[fieldName]) {
      replaceValue = v[fieldName];
    }
    if (replaceValue[srcLocale]) {
      replaceValue[dstLocale] = replaceValue[srcLocale];
      var replaceObject = {};
      replaceObject[fieldName] = replaceValue;

      db[table].update({_id: v._id}, {$set: replaceObject});
    }
  });
});
db = connect('localhost:27017/api-factory');

localizedFieldName = 'localized_' + fieldName;


tableQuery = {};
tableQuery['name'] = tableName;
query = {};
query[fieldName] = {$exists: true};

db.entities.find(tableQuery).forEach(function (e) {
  var table = 'tableentity_' + e['_id'].str;
  db[table].find(query).forEach(function (v) {
    var replaceValue = {};
    if (v[localizedFieldName]) {
      replaceValue = v[localizedFieldName];
    }
    replaceValue[locale] = v[fieldName];
    var replaceObject = {};
    replaceObject[localizedFieldName] = replaceValue;

    db[table].update({_id: v._id}, {$set: replaceObject});
  });
});
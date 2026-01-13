db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'certificates'}, {
  $set: { 'options.fields.overrides': { "type" : "object", "name" : "overrides", "default" : { }} }
});

db.tableentity_5c665b0c732141e61a9efe5cs.find().forEach(function(v) {
    db.tableentity_5c665b0c732141e61a9efe5cs.update({_id: v._id}, {$set: {geo : {type: 'Point', coordinates: [v.geo.coordinates[1], v.geo.coordinates[0]]}}});
});


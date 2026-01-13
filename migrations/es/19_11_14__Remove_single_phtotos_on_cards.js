db = connect('localhost:27017/api-factory');

db.tableentity_5a8acc1b265be1072082751fs.find({photo: {$exists: true}, $or: [{ photos: {$exists: false}}, {photos: {$eq: []}}] }).forEach(function (v) {
  var photos = [];
  var doc = db.tableentity_5c7e1488dcc718e1e10a6129.insertOne({
    'photo': v.photo,
    'thumbnail': v.thumbnail
  });
  photos.push(doc.insertedId);
  db.tableentity_5a8acc1b265be1072082751fs.update({'_id': v._id}, {
    $set: {
      'photos': photos
    }
  });
});

db.tableentity_5a8acc1b265be1072082751fs.update({}, {
  $unset: {
    'photo': '',
    'thumbnail': '',
  }
});
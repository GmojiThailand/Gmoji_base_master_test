db = connect('localhost:27017/api-factory');

db.tableentity_58973d924802c138d75d91e6.find({localized_value: {$exists: true}}).forEach(function(v) {
  db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {value: v.localized_value.ru_RU}, $unset: {localized_value: ""}});
});

db.tableentity_58973d924802c138d75d91e6.find({localized_value_hint: {$exists: true}}).forEach(function(v) {
  db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {value_hint: v.localized_value_hint.ru_RU}, $unset: {localized_value_hint: ""}});
});

db.tableentity_58973d924802c138d75d91e6.find({localized_description: {$exists: true}}).forEach(function(v) {
  db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {description: v.localized_description.ru_RU}, $unset: {localized_description: ""}});
});
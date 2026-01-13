db = connect('localhost:27017/api-factory');

db.tableentity_5a8acc1b265be1072082751fs.updateMany({contragent_name: {$exists: true}}, {$unset: {contragent_name: 1}});

db = connect('localhost:27017/api-factory');

db.user_587640c995ed3c0c59b14600.save({
  '_id': ObjectId('5ab25ed7b8c83b6d7a6391ad'),
  'updatedAt': '2018-05-16T07:56:57.828Z',
  'createdAt': '2018-03-21T13:32:07.778Z',
  'username': 'skoro@skoro.skoro',
  'password': '2d4eec82df2ef7504235311afb12bef4',
  'type': 'oauth',
  'role':ObjectId('58860d1bc6887053b5978bb3'),
});

db.tableentity_5876419795ed3c0c59b14601.save({
  '_id': ObjectId('5ab25ed9b8c83b6d7a6391af'),
  'updatedAt': '2018-03-21T13:32:09.287Z',
  'createdAt': '2018-03-21T13:32:09.287Z',
  'user_id': '5ab25ed7b8c83b6d7a6391ad',
  'agent_contract_date': '1999-12-31T20:00:00.000Z',
  'agent_contract_number': 'Skoro',
  'commission_common': 0,
  'description': 'Скоро',
  'fact_building': '1',
  'fact_city': 'Скоро',
  'fact_street': 'Скоро',
  'inn': '111111111111',
  'law_building': '1',
  'law_city': 'Скоро',
  'law_street': 'Скоро',
  'name': 'Скоро',
  'phone': '71111111111',
  'status': ObjectId('598d9bac47217f28ba69e0f5'),
});

printjson(db.tableentity_5876419795ed3c0c59b14601.findOne({user_id: '5ab25ed7b8c83b6d7a6391ad'}));

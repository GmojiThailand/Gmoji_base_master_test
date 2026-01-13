db = connect('localhost:27017/api-factory');

let productsIds = db.tableentity_58973d924802c138d75d91e6.find({
  is_coupon_limited: true,
  status: new ObjectId('598d9bac47217f28ba69e0f5')
}).map((v) => v._id);
db.tableentity_5a13bdc89f272c123aacefcds.deleteMany({product: {$in: productsIds}});

db.tableentity_58973d924802c138d75d91e6.updateMany(
  {_id: {$in: productsIds}},
  {
    $set: {'static_pin': '******'}
  }
);

productsIds = productsIds.map((v) => v.str);
db.tableentity_59145eba2aac0e07c131c5d4.updateMany(
  {product_id: {$in: productsIds}},
  {
    $set: {limit: NumberInt(999999)}
  }
);

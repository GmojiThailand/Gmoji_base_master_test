db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
    $set: { 'options.fields.show_camera': { 'type': 'boolean', 'name': 'show_camera' } }
});

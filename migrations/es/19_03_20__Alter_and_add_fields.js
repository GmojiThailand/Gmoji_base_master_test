/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2019
 */

db = connect('localhost:27017/api-factory');

db.entities.update({'name': 'products'}, {
    $set: {
        'options.fields.show_map': {
            'type': 'boolean',
            'name': 'show_map'
        },
        'options.fields.show_delivery': {
            'type': 'boolean',
            'name': 'show_delivery'
        },
        'options.fields.show_copy_button': {
            'type': 'boolean',
            'name': 'show_copy_button'
        },
        'options.fields.show_callback': {
            'type': 'boolean',
            'name': 'show_callback'
        },
        'options.fields.product_code_type': {
            'type': 'string',
            'name': 'product_code_type'
        },
        'options.fields.multi_purchase': {
            'type': 'boolean',
            'name': 'multi_purchase'
        },
        'options.fields.send_photo': {
            'type': 'boolean',
            'name': 'send_photo'
        },
        'options.fields.item_type': {
            'type': 'string',
            'name': 'item_type'
        }
    },
    $unset: {
        'options.fields.showMap': '',
        'options.fields.showDelivery': '',
        'options.fields.showCopyButton': '',
        'options.fields.showCallback': '',
        'options.fields.codeType': '',
        'options.fields.multiPurchase': '',
        'options.fields.sendPhoto': '',
        'options.fields.itemType': ''
    }
});

db.entities.update({'name': 'city'}, {
    $set: {
        'options.fields.short_name': {
            'type': 'string',
            'name': 'short_name'
        }
    },
    $unset: {
        'options.fields.shortName': ''
    }
});

db.entities.update({'name': 'users'}, {
    $set: {
        'options.fields.metrika_track_id': {
            'type': 'string',
            'name': 'metrika_track_id'
        },
        'options.fields.city_by_phone': {
            'type': 'string',
            'name': 'city_by_phone'
        }
    },
    $unset: {
        'options.fields.metrikaTrackId': ''
    }
});

db.tableentity_58973d924802c138d75d91e6.find({showMap: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {show_map: v.showMap}, $unset: {showMap: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({showDelivery: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {show_delivery: v.showDelivery}, $unset: {showDelivery: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({showCopyButton: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {show_copy_button: v.showCopyButton}, $unset: {showCopyButton: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({showCallback: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {show_callback: v.showCallback}, $unset: {showCallback: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({codeType: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {product_code_type: v.codeType}, $unset: {codeType: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({multiPurchase: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {multi_purchase: v.multiPurchase}, $unset: {multiPurchase: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({sendPhoto: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {send_photo: v.sendPhoto}, $unset: {sendPhoto: ""}});
});
db.tableentity_58973d924802c138d75d91e6.find({itemType: {$exists: true}}).forEach(function(v) {
    db.tableentity_58973d924802c138d75d91e6.update({_id: v._id}, {$set: {item_type: v.itemType}, $unset: {itemType: ""}});
});
db.tableentity_5c665b0c732141e61a9efe5cs.find({shortName: {$exists: true}}).forEach(function(v) {
    db.tableentity_5c665b0c732141e61a9efe5cs.update({_id: v._id}, {$set: {short_name: v.shortName}, $unset: {shortName: ""}});
});
db.tableentity_587641b195ed3c0c59b14602.find({metrikaTrackId: {$exists: true}}).forEach(function(v) {
    db.tableentity_587641b195ed3c0c59b14602.update({_id: v._id}, {$set: {metrika_track_id: v.metrikaTrackId}, $unset: {metrikaTrackId: ""}});
});


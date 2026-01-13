/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2019
 */

db.entities.update({name: 'notify'}, {$set:{"options.routes.call_back.params.bcc": "orders@gmoji.com.ua"}});

db.entities.update({name: 'notify'}, {$set:{"options.routes.sms_auth.params.message": "GMOJI code: {$code}"}});
db.entities.update({name: 'notify'}, {$set:{"options.routes.sms_auth_first.params.message": "GMOJI code: {$code} - Ваш код дійсний 2 хвилини"}});

db.entities.update({name: 'notify'}, {$set:{"options.routes.sms_delivery_pin.params.message": "Ваш PIN-код (вимовити оператору): {$gponPin}"}});

db.user_587640c995ed3c0c59b14600.update({ "_id" : ObjectId("5979877576b74414134c2ee1")},{$set:{username: "admin@uz", password: "1"}});
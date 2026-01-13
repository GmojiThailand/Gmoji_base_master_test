db = connect('localhost:27017/api-factory');

db.accesstokens.remove({});
db.authorizationcodes.remove({});
db.refreshtokens.remove({});
db.setProfilingLevel(0);
db.system.profile.drop();

db.tableentity_59e0b1a65c23ce0946a0be87.remove({}); // маппинг gmoji
db.tableentity_5a13bdc89f272c123aacefcds.remove({}); // купоны
db.tableentity_5a144f109f272c123aacf332.remove({}); // guid
db.tableentity_59b1501abc280b12d32b98aes.remove({}); // дарения
db.tableentity_59b15140bc280b12d32b98b0.remove({}); // владения
db.tableentity_59b24e0dbc280b12d32b98c7.remove({}); // субконтрагенты
db.tableentity_5a9fefa4265be10720827a26.remove({}); // попытки входа в систему
db.tableentity_5aaa8438265be10720827c88.remove({}); // пользователи cloud payments
db.tableentity_5addecec44b13f2b038ebc77.remove({}); // токены проверки email
db.tableentity_58c10bd8e42c18189482ffc8.remove({}); // токены сброса пароля
db.tableentity_58b7c0bb91a2f13f65144b57.remove({}); // коды проверки
db.tableentity_597f28d97c18e31a6c8fa738.remove({}); // пользователи payture
db.tableentity_59c28a1369222c4b8fcfbc04.remove({}); // попытки гашения
db.tableentity_5996d9111a914d7dc7e71141.remove({}); // гашения
db.tableentity_5a855cee265be107208274dfs.remove({}); // счетчики
db.tableentity_5a855cee265be107208274dfs.insert({ "value" : { "main" : 0 }, "name" : "product_categories" });
db.tableentity_5a855cee265be107208274dfs.insert({ "name" : "products", "value" : { } });
db.tableentity_5a855cee265be107208274dfs.insert({ "value" : { "main" : 0 }, "name" : "users" });
db.tableentity_59145eba2aac0e07c131c5d4.remove({}); // лимиты
db.tableentity_5b45b4d9a717111871bea198.remove({}); // карточка товара на точке
db.tableentity_5a8acc1b265be1072082751fs.remove({}); // карточки товар - контрагент
db.tableentity_587641c295ed3c0c59b14603.remove({user_id : { $nin : ['5ab25ed7b8c83b6d7a6391ad', '5979877576b74414134c2ee1']}}); // gmoji
db.tableentity_592e5ddc5187d01f677a1e4es.remove({}); // заказы (оплаты)
db.tableentity_5ae3316ae0e6b91fe110689cs.remove({}); // инструкции к товарам
db.tableentity_5876420595ed3c0c59b14606.remove({}); // точки
db.tableentity_5c7e1488dcc718e1e10a6129.remove({}); // фото товаров
db.tableentity_58973d924802c138d75d91e6.remove({}); // товары
db.tableentity_5876419795ed3c0c59b14601.remove({user_id : { $nin : ['5ab25ed7b8c83b6d7a6391ad'] }}); // контрагенты
db.tableentity_587641b195ed3c0c59b14602.remove({}); // пользователи
db.tableentity_587641dd95ed3c0c59b14604.remove({_id : { $nin : [ObjectId('58e5f191d351f81cc3fa6a0a')] }}); // категории
db.tableentity_58b91e756521367de466f328.remove({_id : { $nin : [ObjectId('5be563048755c0609438fbae')] }}); // картинки
//db.tableentity_598d9a4747217f28ba69e0f3.remove({}); // статусы
//db.tableentity_5a95044e265be107208275c9.remove({}); // права
db.user_587640c995ed3c0c59b14600.remove({_id : { $nin : [ObjectId('5ab25ed7b8c83b6d7a6391ad'), ObjectId('5979877576b74414134c2ee1')] }}); // пользователи
db.tableentity_5c665b0c732141e61a9efe5cs.remove({}); // города
db.tableentity_5c89032f78854aee26df1355.remove({}); // города провайдеров доставки
db.tableentity_5ca35171d20328aa37c21075.remove({}); // локали
db.tableentity_5cb484a6fb9f58d057a60713.remove({}); // станции метро
db.tableentity_5a8bebf5265be10720827533.remove({}); // логи
db.tableentity_5ce29cf6ba6554d5fe86163as.remove({}); // теги
db.tableentity_5ce29cf07101ae7e39bcc4f8.remove({}); // gift promo history
db.tableentity_5ce29cf07101ae7e39bcc4f7.remove({}); // gift promo rule
db.simple_storage.remove({});
db.support_message.remove({});
db.replaceable_coupon.remove({});
db.referal_balance.remove({});
db.referal_balance_history.remove({});
db.referal_cashback_rule.remove({});
db.referal_coupon.remove({});
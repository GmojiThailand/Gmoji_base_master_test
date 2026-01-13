db = connect('localhost:27017/api-factory');

db.entities.find({'name': 'city'}).forEach(function (v) {
    var region = '';
    var regionId = null;
    var cityTable = 'tableentity_' + v['_id'].str + 's';
    [
        ['Ленинградская обл', 'Всеволожский р-н', 'Мурино'],
        ['Чеченская Респ', '', 'Урус-Мартан'],
        ['Ленинградская обл', 'Всеволожский р-н', 'Кудрово'],
        ['Чеченская Респ', '', 'Курчалой'],
        ['Московская обл', 'Воскресенский р-н', 'Белоозерский'],
        ['Татарстан Респ', 'Кукморский район', 'Кукмор'],
        ['Крым Респ', '', 'Алупка']
    ].forEach(function (w) {
        if (w[0] !== region) {
            db[cityTable].save({
                sorting: NumberInt(0),
                level: NumberInt(0),
                main: false,
                popular: false,
                timezone: NumberInt(3),
                name: w[0],
                shortName: w[0],
                geo: {type: 'Point', coordinates: [0, 0]},
                status: new ObjectId('598d9bac47217f28ba69e0f5'),
                parent: null
            });
            var city = db[cityTable].findOne({name: w[0]});
            region = w[0];
            regionId = city._id;
        }
        db[cityTable].save({
            sorting: NumberInt(1),
            level: NumberInt(1),
            main: false,
            popular: false,
            timezone: NumberInt(3),
            name: w[2],
            shortName: w[2],
            geo: {type: 'Point', coordinates: [0, 0]},
            status: new ObjectId('598d9bac47217f28ba69e0f5'),
            parent: regionId
        });
    });
});

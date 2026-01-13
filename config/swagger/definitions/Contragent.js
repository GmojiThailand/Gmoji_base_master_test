module.exports = {
  Contragent: {
    type: 'object',
    description: 'Объект контрагента',
    properties: {
      'updatedAt': {
        type: 'number',
        description: 'Системное поле даты последнего обновления записи в БД в формате UNIX Timestamp',
      },
      'createdAt': {
        type: 'number',
        description: 'Системное поле даты создания записи в БД в формате UNIX Timestamp',
      },
      'user_id': {
        type: 'string',
        description: 'Системный id контрагента',
      },
      'name': {
        type: 'string',
        description: 'Название контрагента',
      },
      'city': {
        type: 'string',
        description: 'Ассоциированный с контрагентом город',
      },
      'phone': {
        type: 'string',
        description: 'Телефон контрагента',
      },
      'description': {
        type: 'string',
        description: 'Описание контрагента',
      },
      'logo': {
        $ref: '#/definitions/Image',
      },
      'fact_city': {
        type: 'string',
        description: 'Город в фактическом адресе контрагента',
      },
      'fact_street': {
        type: 'string',
        description: 'Улица в фактическом адресе контрагента',
      },
      'fact_building': {
        type: 'string',
        description: 'Строение в фактическом адресе контрагента',
      },
      'law_city': {
        type: 'string',
        description: 'Город в юридическом адресе контрагента',
      },
      'law_street': {
        type: 'string',
        description: 'Улица в юридическом адресе контрагента',
      },
      'law_building': {
        type: 'string',
        description: 'Строение в юридическом адресе контрагента',
      },
      'status': {
        $ref: '#/definitions/Status',
      },
      'id': {
        type: 'string',
        description: 'Id контрагента из таблицы contragents',
      },
    },
  },
  example: {
    'updatedAt': 1519047740148,
    'createdAt': 1502258119942,
    'user_id': '598aa3c747217f28ba69b59d',
    'name': 'Barbersh0p ЦЕХ',
    'city': 'Ульяновск',
    'phone': '73433191822',
    'description': 'Barbershop1 ЦЕХ — мужская парикмахерская, расположенная в центре',
    'logo': {
      'image': {'...': '...'},
    },
    'fact_city': 'Ульяновск',
    'fact_street': 'Советская',
    'fact_building': '2',
    'law_city': 'Самара',
    'law_street': 'Самарская',
    'law_building': '1',
    'status': {
      'name_en': 'active',
      'name': 'Активен',
      'id': '598d9bac47217f28ba69e0f5',
    },
    'id': '598aa3c747217f28ba69b59e',
  },
};

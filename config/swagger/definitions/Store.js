module.exports = {
  Store: {
    type: 'object',
    description: 'Объект торговой точки',
    properties: {
      'updatedAt': {
        type: 'number',
        description: 'Системное поле даты последнего обновления записи в БД в формате UNIX Timestamp',
      },
      'createdAt': {
        type: 'number',
        description: 'Системное поле даты создания записи в БД в формате UNIX Timestamp',
      },
      'contragent': {
        type: 'string',
        description: 'Id контрагента из таблицы contragents',
      },
      'user_id': {
        type: 'string',
        description: 'Системный id контрагента из таблицы contragents',
      },
      'name': {
        type: 'string',
        description: 'Название торговой точки',
      },
      'geo': {
        type: 'array',
        description: 'Гео-координаты торговой точки',
        items: {
          type: 'number',
        },
      },
      'status': {
        $ref: '#/definitions/Status',
      },
      'city': {
        type: 'string',
        description: 'Город в адресе торговой точки',
      },
      'street': {
        type: 'string',
        description: 'Улица в адресе торговой точки',
      },
      'building': {
        type: 'string',
        description: 'Номер строения в адресе торговой точки',
      },
      'subcontragent': {
        $ref: '#/definitions/Subcontragent',
      },
      'id': {
        type: 'string',
        description: 'id торговой точки',
      },
    },
    example: {
      'updatedAt': 1507887188309,
      'createdAt': 1502258868303,
      'contragent': '598aa3c747217f28ba69b59e',
      'user_id': '598aa3c747217f28ba69b59d',
      'name': 'Store name',
      'geo': [54.1546028, 48.385275200000024],
      'status': {
        'name_en': 'active',
        'name': 'Активен',
        'id': '598d9bac47217f28ba69e0f5',
      },
      'city': 'Ульяновск',
      'street': 'ул. Мира',
      'building': '4',
      'subcontragent': {
        'user_id': '5a95506290c8561ec2d18fd3',
        'login': 'store subcontragent name',
        'contragent': {'...': '...'},
        'id': '5a95506290c8561ec2d18fd4',
      },
      'id': '598aa6b447217f28ba69b5fb',
    },
  },
};

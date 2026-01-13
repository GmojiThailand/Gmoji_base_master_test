module.exports = {
  // TODO: Заполнить роут
  '/create_new_ca': {
    post: {
      tags: ['Contragent'],
      summary: 'Создание контрагента',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Bearer ',
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          default: '587640c995ed3c0c59b14600',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/edit_ca': {
    post: {
      tags: ['Contragent'],
      summary: 'Редактирование контрагента',
      description: 'Редактирование данных контрагента. Администратор может редактировать любого контрагента, указав user_id. Контрагент может редактировать только свои данные. Представитель контрагента может редактировать данные своего контрагента.',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          type: 'string',
          default: 'Bearer ',
          required: true,
          description: 'Bearer token для аутентификации',
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          default: '587640c995ed3c0c59b14600',
          required: true,
          description: 'ID приложения',
        },
        {
          name: 'body',
          in: 'body',
          type: 'object',
          description: 'Объект с полями контрагента для редактирования',
          required: false,
          schema: {
            type: 'object',
            properties: {
              'user_id': {
                type: 'string',
                description: 'Системный ID контрагента (только для администратора)',
              },
              'email': {
                type: 'string',
                description: 'Новый email/логин контрагента',
              },
              'name': {
                type: 'string',
                description: 'Название контрагента',
              },
              'phone': {
                type: 'string',
                description: 'Телефон контрагента',
              },
              'fact_city': {
                type: 'string',
                description: 'Город фактического адреса',
              },
              'fact_street': {
                type: 'string',
                description: 'Улица фактического адреса',
              },
              'fact_building': {
                type: 'string',
                description: 'Строение фактического адреса',
              },
              'law_city': {
                type: 'string',
                description: 'Город юридического адреса',
              },
              'law_street': {
                type: 'string',
                description: 'Улица юридического адреса',
              },
              'law_building': {
                type: 'string',
                description: 'Строение юридического адреса',
              },
              'city': {
                type: 'string',
                description: 'Город контрагента',
              },
              'description': {
                type: 'string',
                description: 'Описание контрагента',
              },
              'delivery_email': {
                type: 'string',
                description: 'Email для доставки',
              },
              'commission_common': {
                type: 'number',
                description: 'Общая комиссия контрагента',
              },
              'inn': {
                type: 'string',
                description: 'ИНН контрагента',
              },
              'legal_type': {
                type: 'string',
                description: 'Тип юридического лица',
              },
            },
            example: {
              'name': 'Новое название контрагента',
              'phone': '1234567890',
              'fact_city': 'Москва',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            type: 'object',
            properties: {
              'data': {
                type: 'object',
                properties: {
                  'contragent': {
                    $ref: '#/definitions/Contragent',
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Неверные параметры',
        },
        '401': {
          description: 'Не авторизован',
        },
        '403': {
          description: 'Доступ запрещен',
        },
        '404': {
          description: 'Контрагент не найден',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};

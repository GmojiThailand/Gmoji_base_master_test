module.exports = {
  '/create_store': {
    post: {
      tags: ['Store'],
      summary: 'Создание торговой точки',
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
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с полями торговой точки',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'contragent': {
                type: 'string',
                description: 'Id контрагента из таблицы contragents',
              },
              'user_id': {
                type: 'string',
                description: 'Системный id контрагента',
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
                description: 'Строение в адресе торговой точки',
              },
              'subcontragent_name': {
                type: 'string',
                description: 'Имя представителя торговой точки',
              },
            },
            required: [
              'contragent',
              'user_id',
              'name',
              'geo',
              'city',
              'street',
              'building',
              'subcontragent_name',
            ],
            example: {
              'contragent': '598aa3c747217f28ba69b59e',
              'user_id': '598aa3c747217f28ba69b59d',
              'name': 'Store name',
              'geo': [54.3131231, 48.38524589999997],
              'city': 'г. Ульяновск',
              'street': 'ул. Ленина',
              'building': '47',
              'subcontragent_name': 'Store subcontragent name',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            $ref: '#/definitions/Store',
          },
        },
        '406': {
          description: 'Incorrect request fields',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/edit_store': {
    post: {
      tags: ['Store'],
      summary: 'Редактирование торговой точки',
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
        {
          name: 'body',
          in: 'body',
          type: 'string',
          description: 'Объект с полями торговой точки',
          required: true,
          schema: {
            type: 'object',
            properties: {
              'id': {
                type: 'string',
                description: 'Id торговой точки из таблицы stores',
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
                description: 'Строение в адресе торговой точки',
              },
            },
            required: [
              'id',
            ],
            example: {
              'id': '5a856053ac02eb4634067504',
              'name': 'New store name',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          schema: {
            $ref: '#/definitions/Store',
          },
        },
        '406': {
          description: 'Store id required',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};

module.exports = {
  '/add_push': {
    post: {
      tags: ['Push'],
      summary: 'Добавление пуш токена',
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
          name: 'type',
          in: 'formData',
          type: 'string',
          required: true,
          description: 'ios || android',
        },
        {
          name: 'token',
          in: 'formData',
          type: 'string',
          required: true,
          description: '',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
        '400': {
          description: 'Неверные параметры',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/get_push': {
    get: {
      tags: ['Push'],
      summary: 'Выгрузка пуш токенов',
      parameters: [
        {
          name: 'Authorization',
          in: 'header',
          default: 'Basic NTg3NjQwYzk5NWVkM2MwYzU5YjE0NjAwOjg4YmYxY2Q3MGQ=',
        },
        {
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          default: '587640c995ed3c0c59b14600',
        },
        {
          name: 'user_id',
          in: 'query',
          type: 'string',
          required: false,
          description: '',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
        '400': {
          description: 'Неверные параметры',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
};

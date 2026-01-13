module.exports = {
  '/list_role': {
    get: {
      tags: ['RoleController'],
      summary: 'Просмотр списком существующие роли',
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
        '400': {
          description: 'Неверные параметры',
        },
        '50x': {
          description: 'Ошибка сервера',
        },
      },
    },
  },
  '/get_role': {
    get: {
      tags: ['RoleController'],
      summary: 'Просмотр конкретной роли',
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
          name: 'id',
          in: 'formData',
          type: 'string',
          required: true,
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
  '/edit_role': {
    post: {
      tags: ['RoleController'],
      summary: 'Редактирование роли',
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
          name: 'id',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'name',
          in: 'formData',
          type: 'string',
          required: false,
        },
        {
          name: 'permissions',
          in: 'formData',
          type: 'object',
          required: false,
          description: '{enable: [ id, id, id ], disable: [ id, id, id]}',
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
  '/delete_role': {
    post: {
      tags: ['RoleController'],
      summary: 'Удаление роли',
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
          name: 'id',
          in: 'formData',
          type: 'string',
          required: true,
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
  '/create_role': {
    post: {
      tags: ['RoleController'],
      summary: 'Создание роли',
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
          name: 'name_ru',
          in: 'formData',
          type: 'string',
          required: true,
        },
        {
          name: 'permissions',
          in: 'formData',
          type: 'array',
          required: true,
          description: '[id, id]',
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
  '/check_same_role': {
    post: {
      tags: ['RoleController'],
      summary: 'Проверка роли на такие же права',
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
          name: 'permissions',
          in: 'formData',
          type: 'array',
          required: true,
          description: '[id, id]',
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

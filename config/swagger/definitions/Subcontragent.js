module.exports = {
  Subcontragent: {
    type: 'object',
    description: 'Представитель в торговой точке',
    properties: {
      'user_id': {
        type: 'string',
        description: 'Системный id представителя торговой точки',
      },
      'login': {
        type: 'string',
        description: 'Логин/имя представителя торговой точки',
      },
      'contragent': {
        type: 'object',
        description: 'Объект контрагента к которому относится представитель',
        schema: {
          $ref: '#/definitions/Contragent',
        },
      },
      'id': {
        type: 'string',
        description: 'Id представителя торговой точки',
      },
    },
  },
};

module.exports = {
  Status: {
    type: 'object',
    description: 'Статус торговой точки в системе',
    properties: {
      'name_en': {
        type: 'string',
        description: 'Английское наименование статуса торговой точки',
      },
      'name': {
        type: 'string',
        description: 'Русское наименование статуса торговой точки',
      },
      'id': {
        type: 'string',
        description: 'Id статуса торговой точки',
      },
    },
  },
};

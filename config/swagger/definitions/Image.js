module.exports = {
  Image: {
    type: 'object',
    description: 'Объект картинки',
    properties: {
      'id': {
        type: 'string',
        description: 'Id картики из таблицы images',
      },
      'image': {
        type: 'object',
        description: 'Объект с описанием параметров картики',
      },
    },
  },
};

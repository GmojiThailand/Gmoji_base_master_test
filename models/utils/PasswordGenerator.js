exports.exec = function() {
  let text = '';
  let available = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 8; i++) {
    text += available.charAt(Math.floor(Math.random() * available.length));
  }

  return text;
};


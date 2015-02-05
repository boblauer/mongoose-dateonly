module.exports = exports = function (mongoose, opts) {
  return require('./schema')(mongoose);
};

exports.version = require('../package').version;

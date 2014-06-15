module.exports = module.exports || {};
module.exports.algorithms = {
    md5: require('./md5'),
    sha1: require('./sha1'),
    sha256: require('./sha256')
};
module.exports.md5 = require('./md5');
module.exports.sha1 = require('./sha1');
module.exports.sha256 = require('./sha256');

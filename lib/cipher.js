/*
 * Cipher base API.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */
module.exports = module.exports || {};
module.exports.algorithms = module.exports.algorithms || {};
module.exports.createCipher = function(algorithm, key) {
    var api = algorithm;
    if (typeof api === 'string') {
        api = module.exports.getAlgorithm(api);
        if (api) {
            api = api();
        }
    }
    if (!api) {
        throw new Error('Unsupported algorithm: ' + algorithm);
    }
    return new module.exports.BlockCipher({
        algorithm: api,
        key: key,
        decrypt: false
    });
};
module.exports.createDecipher = function(algorithm, key) {
    var api = algorithm;
    if (typeof api === 'string') {
        api = module.exports.getAlgorithm(api);
        if (api) {
            api = api();
        }
    }
    if (!api) {
        throw new Error('Unsupported algorithm: ' + algorithm);
    }
    return new module.exports.BlockCipher({
        algorithm: api,
        key: key,
        decrypt: true
    });
};
module.exports.registerAlgorithm = function(name, algorithm) {
    name = name.toUpperCase();
    module.exports.algorithms[name] = algorithm;
};
module.exports.getAlgorithm = function(name) {
    name = name.toUpperCase();
    if (name in module.exports.algorithms) {
        return module.exports.algorithms[name];
    }
    return null;
};
var BlockCipher = module.exports.BlockCipher = function(options) {
    this.algorithm = options.algorithm;
    this.mode = this.algorithm.mode;
    this.blockSize = this.mode.blockSize;
    this._finish = false;
    this._input = null;
    this.output = null;
    this._op = options.decrypt ? this.mode.decrypt : this.mode.encrypt;
    this._decrypt = options.decrypt;
    this.algorithm.initialize(options);
};
BlockCipher.prototype.start = function(options) {
    options = options || {};
    this._finish = false;
    this._input = require('./util').createBuffer();
    this.output = options.output || require('./util').createBuffer();
    this.mode.start(options);
};
BlockCipher.prototype.update = function(input) {
    if (!this._finish) {
        this._input.putBuffer(input);
    }
    while (this._input.length() >= this.blockSize || this._input.length() > 0 && this._finish) {
        this._op.call(this.mode, this._input, this.output);
    }
    this._input.compact();
};
BlockCipher.prototype.finish = function(pad) {
    if (pad && this.mode.name === 'CBC') {
        this.mode.pad = function(input) {
            return pad(this.blockSize, input, false);
        };
        this.mode.unpad = function(output) {
            return pad(this.blockSize, output, true);
        };
    }
    var options = {};
    options.overflow = this._input.length() % this.blockSize;
    if (!this._decrypt && this.mode.pad) {
        if (!this.mode.pad(this._input, options)) {
            return false;
        }
    }
    this._finish = true;
    this.update();
    if (this._decrypt && this.mode.unpad) {
        if (!this.mode.unpad(this.output, options)) {
            return false;
        }
    }
    if (this.mode.afterFinish) {
        if (!this.mode.afterFinish(this.output, options)) {
            return false;
        }
    }
    return true;
};
module.exports.modes = require('./cipherModes')

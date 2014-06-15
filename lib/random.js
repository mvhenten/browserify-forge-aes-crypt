if (module.exports && module.exports.getBytes) {
    return;
}
(function(jQuery) {
    var prng_aes = {};
    var _prng_aes_output = new Array(4);
    var _prng_aes_buffer = require('./util').createBuffer();
    prng_aes.formatKey = function(key) {
        var tmp = require('./util').createBuffer(key);
        key = new Array(4);
        key[0] = tmp.getInt32();
        key[1] = tmp.getInt32();
        key[2] = tmp.getInt32();
        key[3] = tmp.getInt32();
        return require('./aes')._expandKey(key, false);
    };
    prng_aes.formatSeed = function(seed) {
        var tmp = require('./util').createBuffer(seed);
        seed = new Array(4);
        seed[0] = tmp.getInt32();
        seed[1] = tmp.getInt32();
        seed[2] = tmp.getInt32();
        seed[3] = tmp.getInt32();
        return seed;
    };
    prng_aes.cipher = function(key, seed) {
        require('./aes')._updateBlock(key, seed, _prng_aes_output, false);
        _prng_aes_buffer.putInt32(_prng_aes_output[0]);
        _prng_aes_buffer.putInt32(_prng_aes_output[1]);
        _prng_aes_buffer.putInt32(_prng_aes_output[2]);
        _prng_aes_buffer.putInt32(_prng_aes_output[3]);
        return _prng_aes_buffer.getBytes();
    };
    prng_aes.increment = function(seed) {
        ++seed[3];
        return seed;
    };
    prng_aes.md = require('./md').sha256;

    function spawnPrng() {
        var ctx = require('./prng').create(prng_aes);
        ctx.getBytes = function(count, callback) {
            return ctx.generate(count, callback);
        };
        ctx.getBytesSync = function(count) {
            return ctx.generate(count);
        };
        return ctx;
    }
    var _ctx = spawnPrng();
    var _nodejs = typeof process !== 'undefined' && process.versions && process.versions.node;
    var getRandomValues = null;
    if (typeof window !== 'undefined') {
        var _crypto = window.crypto || window.msCrypto;
        if (_crypto && _crypto.getRandomValues) {
            getRandomValues = function(arr) {
                return _crypto.getRandomValues(arr);
            };
        }
    }
    if (!_nodejs && !getRandomValues) {
        if (typeof window === 'undefined' || window.document === undefined) {}
        _ctx.collectInt(+new Date(), 32);
        if (typeof navigator !== 'undefined') {
            var _navBytes = '';
            for (var key in navigator) {
                try {
                    if (typeof navigator[key] == 'string') {
                        _navBytes += navigator[key];
                    }
                } catch (e) {}
            }
            _ctx.collect(_navBytes);
            _navBytes = null;
        }
        if (jQuery) {
            jQuery().mousemove(function(e) {
                _ctx.collectInt(e.clientX, 16);
                _ctx.collectInt(e.clientY, 16);
            });
            jQuery().keypress(function(e) {
                _ctx.collectInt(e.charCode, 8);
            });
        }
    }
    if (!require('./random')) {
        module.exports = _ctx;
    } else {
        for (var key in _ctx) {
            module.exports[key] = _ctx[key];
        }
    }
    module.exports.createInstance = spawnPrng;
}(typeof jQuery !== 'undefined' ? jQuery : null));

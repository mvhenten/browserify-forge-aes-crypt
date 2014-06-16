/*
 * A javascript implementation of a cryptographically-secure
 * Pseudo Random Number Generator (PRNG). The Fortuna algorithm is followed
 * here though the use of SHA-256 is not enforced; when generating an
 * a PRNG context, the hashing algorithm and block cipher used for
 * the generator are specified via a plugin.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */
var _nodejs = typeof process !== 'undefined' && process.versions && process.versions.node;
var _crypto = null;
if (_nodejs && !process.versions['node-webkit']) {
    _crypto = require('crypto');
}
var prng = module.exports = module.exports || {};
prng.create = function(plugin) {
    var ctx = {
        plugin: plugin,
        key: null,
        seed: null,
        time: null,
        reseeds: 0,
        generated: 0
    };
    var md = plugin.md;
    var pools = new Array(32);
    for (var i = 0; i < 32; ++i) {
        pools[i] = md.create();
    }
    ctx.pools = pools;
    ctx.pool = 0;
    ctx.generate = function(count, callback) {
        if (!callback) {
            return ctx.generateSync(count);
        }
        var cipher = ctx.plugin.cipher;
        var increment = ctx.plugin.increment;
        var formatKey = ctx.plugin.formatKey;
        var formatSeed = ctx.plugin.formatSeed;
        var b = require('./util').createBuffer();
        ctx.key = null;
        generate();

        function generate(err) {
            if (err) {
                return callback(err);
            }
            if (b.length() >= count) {
                return callback(null, b.getBytes(count));
            }
            if (ctx.generated > 1048575) {
                ctx.key = null;
            }
            if (ctx.key === null) {
                return require('./util').nextTick(function() {
                    _reseed(generate);
                });
            }
            var bytes = cipher(ctx.key, ctx.seed);
            ctx.generated += bytes.length;
            b.putBytes(bytes);
            ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
            ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
            require('./util').setImmediate(generate);
        }
    };
    ctx.generateSync = function(count) {
        var cipher = ctx.plugin.cipher;
        var increment = ctx.plugin.increment;
        var formatKey = ctx.plugin.formatKey;
        var formatSeed = ctx.plugin.formatSeed;
        ctx.key = null;
        var b = require('./util').createBuffer();
        while (b.length() < count) {
            if (ctx.generated > 1048575) {
                ctx.key = null;
            }
            if (ctx.key === null) {
                _reseedSync();
            }
            var bytes = cipher(ctx.key, ctx.seed);
            ctx.generated += bytes.length;
            b.putBytes(bytes);
            ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
            ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
        }
        return b.getBytes(count);
    };

    function _reseed(callback) {
        if (ctx.pools[0].messageLength >= 32) {
            _seed();
            return callback();
        }
        var needed = 32 - ctx.pools[0].messageLength << 5;
        ctx.seedFile(needed, function(err, bytes) {
            if (err) {
                return callback(err);
            }
            ctx.collect(bytes);
            _seed();
            callback();
        });
    }

    function _reseedSync() {
        if (ctx.pools[0].messageLength >= 32) {
            return _seed();
        }
        var needed = 32 - ctx.pools[0].messageLength << 5;
        ctx.collect(ctx.seedFileSync(needed));
        _seed();
    }

    function _seed() {
        var md = ctx.plugin.md.create();
        md.update(ctx.pools[0].digest().getBytes());
        ctx.pools[0].start();
        var k = 1;
        for (var i = 1; i < 32; ++i) {
            k = k === 31 ? 2147483648 : k << 2;
            if (k % ctx.reseeds === 0) {
                md.update(ctx.pools[i].digest().getBytes());
                ctx.pools[i].start();
            }
        }
        var keyBytes = md.digest().getBytes();
        md.start();
        md.update(keyBytes);
        var seedBytes = md.digest().getBytes();
        ctx.key = ctx.plugin.formatKey(keyBytes);
        ctx.seed = ctx.plugin.formatSeed(seedBytes);
        ctx.reseeds = ctx.reseeds === 4294967295 ? 0 : ctx.reseeds + 1;
        ctx.generated = 0;
    }

    function defaultSeedFile(needed) {
        var getRandomValues = null;
        if (typeof window !== 'undefined') {
            var _crypto = window.crypto || window.msCrypto;
            if (_crypto && _crypto.getRandomValues) {
                getRandomValues = function(arr) {
                    return _crypto.getRandomValues(arr);
                };
            }
        }
        var b = require('./util').createBuffer();
        if (getRandomValues) {
            while (b.length() < needed) {
                var count = Math.max(1, Math.min(needed - b.length(), 65536) / 4);
                var entropy = new Uint32Array(Math.floor(count));
                try {
                    getRandomValues(entropy);
                    for (var i = 0; i < entropy.length; ++i) {
                        b.putInt32(entropy[i]);
                    }
                } catch (e) {
                    if (!(typeof QuotaExceededError !== 'undefined' && e instanceof QuotaExceededError)) {
                        throw e;
                    }
                }
            }
        }
        if (b.length() < needed) {
            var hi, lo, next;
            var seed = Math.floor(Math.random() * 65536);
            while (b.length() < needed) {
                lo = 16807 * (seed & 65535);
                hi = 16807 * (seed >> 16);
                lo += (hi & 32767) << 16;
                lo += hi >> 15;
                lo = (lo & 2147483647) + (lo >> 31);
                seed = lo & 4294967295;
                for (var i = 0; i < 3; ++i) {
                    next = seed >>> (i << 3);
                    next ^= Math.floor(Math.random() * 256);
                    b.putByte(String.fromCharCode(next & 255));
                }
            }
        }
        return b.getBytes(needed);
    }
    if (_crypto) {
        ctx.seedFile = function(needed, callback) {
            _crypto.randomBytes(needed, function(err, bytes) {
                if (err) {
                    return callback(err);
                }
                callback(null, bytes.toString());
            });
        };
        ctx.seedFileSync = function(needed) {
            return _crypto.randomBytes(needed).toString();
        };
    } else {
        ctx.seedFile = function(needed, callback) {
            try {
                callback(null, defaultSeedFile(needed));
            } catch (e) {
                callback(e);
            }
        };
        ctx.seedFileSync = defaultSeedFile;
    }
    ctx.collect = function(bytes) {
        var count = bytes.length;
        for (var i = 0; i < count; ++i) {
            ctx.pools[ctx.pool].update(bytes.substr(i, 1));
            ctx.pool = ctx.pool === 31 ? 0 : ctx.pool + 1;
        }
    };
    ctx.collectInt = function(i, n) {
        var bytes = '';
        for (var x = 0; x < n; x += 8) {
            bytes += String.fromCharCode(i >> x & 255);
        }
        ctx.collect(bytes);
    };
    ctx.registerWorker = function(worker) {
        if (worker === self) {
            ctx.seedFile = function(needed, callback) {
                function listener(e) {
                    var data = e.data;
                    if (data.forge && data.forge.prng) {
                        self.removeEventListener('message', listener);
                        callback(data.forge.prng.err, data.forge.prng.bytes);
                    }
                }
                self.addEventListener('message', listener);
                self.postMessage({
                    forge: {
                        prng: {
                            needed: needed
                        }
                    }
                });
            };
        } else {
            var listener = function(e) {
                var data = e.data;
                if (data.forge && data.forge.prng) {
                    ctx.seedFile(data.forge.prng.needed, function(err, bytes) {
                        worker.postMessage({
                            forge: {
                                prng: {
                                    err: err,
                                    bytes: bytes
                                }
                            }
                        });
                    });
                }
            };
            worker.addEventListener('message', listener);
        }
    };
    return ctx;
};

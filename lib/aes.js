module.exports = module.exports || {};
module.exports.startEncrypting = function(key, iv, output, mode) {
    var cipher = _createCipher({
        key: key,
        output: output,
        decrypt: false,
        mode: mode
    });
    cipher.start(iv);
    return cipher;
};
module.exports.createEncryptionCipher = function(key, mode) {
    return _createCipher({
        key: key,
        output: null,
        decrypt: false,
        mode: mode
    });
};
module.exports.startDecrypting = function(key, iv, output, mode) {
    var cipher = _createCipher({
        key: key,
        output: output,
        decrypt: true,
        mode: mode
    });
    cipher.start(iv);
    return cipher;
};
module.exports.createDecryptionCipher = function(key, mode) {
    return _createCipher({
        key: key,
        output: null,
        decrypt: true,
        mode: mode
    });
};
module.exports.Algorithm = function(name, mode) {
    if (!init) {
        initialize();
    }
    var self = this;
    self.name = name;
    self.mode = new mode({
        blockSize: 16,
        cipher: {
            encrypt: function(inBlock, outBlock) {
                return _updateBlock(self._w, inBlock, outBlock, false);
            },
            decrypt: function(inBlock, outBlock) {
                return _updateBlock(self._w, inBlock, outBlock, true);
            }
        }
    });
    self._init = false;
};
module.exports.Algorithm.prototype.initialize = function(options) {
    if (this._init) {
        return;
    }
    var key = options.key;
    var tmp;
    if (typeof key === 'string' && (key.length === 16 || key.length === 24 || key.length === 32)) {
        key = require('./util').createBuffer(key);
    } else if (require('./util').isArray(key) && (key.length === 16 || key.length === 24 || key.length === 32)) {
        tmp = key;
        key = require('./util').createBuffer();
        for (var i = 0; i < tmp.length; ++i) {
            key.putByte(tmp[i]);
        }
    }
    if (!require('./util').isArray(key)) {
        tmp = key;
        key = [];
        var len = tmp.length();
        if (len === 16 || len === 24 || len === 32) {
            len = len >>> 2;
            for (var i = 0; i < len; ++i) {
                key.push(tmp.getInt32());
            }
        }
    }
    if (!require('./util').isArray(key) || !(key.length === 4 || key.length === 6 || key.length === 8)) {
        throw new Error('Invalid key parameter.');
    }
    var mode = this.mode.name;
    var encryptOp = [
            'CFB',
            'OFB',
            'CTR',
            'GCM'
        ].indexOf(mode) !== -1;
    this._w = _expandKey(key, options.decrypt && !encryptOp);
    this._init = true;
};
module.exports._expandKey = function(key, decrypt) {
    if (!init) {
        initialize();
    }
    return _expandKey(key, decrypt);
};
module.exports._updateBlock = _updateBlock;
registerAlgorithm('AES-CBC', require('./cipher').modes.cbc);
registerAlgorithm('AES-CFB', require('./cipher').modes.cfb);
registerAlgorithm('AES-OFB', require('./cipher').modes.ofb);
registerAlgorithm('AES-CTR', require('./cipher').modes.ctr);
registerAlgorithm('AES-GCM', require('./cipher').modes.gcm);

function registerAlgorithm(name, mode) {
    var factory = function() {
        return new module.exports.Algorithm(name, mode);
    };
    require('./cipher').registerAlgorithm(name, factory);
}
var init = false;
var Nb = 4;
var sbox;
var isbox;
var rcon;
var mix;
var imix;

function initialize() {
    init = true;
    rcon = [
        0,
        1,
        2,
        4,
        8,
        16,
        32,
        64,
        128,
        27,
        54
    ];
    var xtime = new Array(256);
    for (var i = 0; i < 128; ++i) {
        xtime[i] = i << 1;
        xtime[i + 128] = i + 128 << 1 ^ 283;
    }
    sbox = new Array(256);
    isbox = new Array(256);
    mix = new Array(4);
    imix = new Array(4);
    for (var i = 0; i < 4; ++i) {
        mix[i] = new Array(256);
        imix[i] = new Array(256);
    }
    var e = 0,
        ei = 0,
        e2, e4, e8, sx, sx2, me, ime;
    for (var i = 0; i < 256; ++i) {
        sx = ei ^ ei << 1 ^ ei << 2 ^ ei << 3 ^ ei << 4;
        sx = sx >> 8 ^ sx & 255 ^ 99;
        sbox[e] = sx;
        isbox[sx] = e;
        sx2 = xtime[sx];
        e2 = xtime[e];
        e4 = xtime[e2];
        e8 = xtime[e4];
        me = sx2 << 24 ^ sx << 16 ^ sx << 8 ^ (sx ^ sx2);
        ime = (e2 ^ e4 ^ e8) << 24 ^ (e ^ e8) << 16 ^ (e ^ e4 ^ e8) << 8 ^ (e ^ e2 ^ e8);
        for (var n = 0; n < 4; ++n) {
            mix[n][e] = me;
            imix[n][sx] = ime;
            me = me << 24 | me >>> 8;
            ime = ime << 24 | ime >>> 8;
        }
        if (e === 0) {
            e = ei = 1;
        } else {
            e = e2 ^ xtime[xtime[xtime[e2 ^ e8]]];
            ei ^= xtime[xtime[ei]];
        }
    }
}

function _expandKey(key, decrypt) {
    var w = key.slice(0);
    var temp, iNk = 1;
    var Nk = w.length;
    var Nr1 = Nk + 6 + 1;
    var end = Nb * Nr1;
    for (var i = Nk; i < end; ++i) {
        temp = w[i - 1];
        if (i % Nk === 0) {
            temp = sbox[temp >>> 16 & 255] << 24 ^ sbox[temp >>> 8 & 255] << 16 ^ sbox[temp & 255] << 8 ^ sbox[temp >>> 24] ^ rcon[iNk] << 24;
            iNk++;
        } else if (Nk > 6 && i % Nk === 4) {
            temp = sbox[temp >>> 24] << 24 ^ sbox[temp >>> 16 & 255] << 16 ^ sbox[temp >>> 8 & 255] << 8 ^ sbox[temp & 255];
        }
        w[i] = w[i - Nk] ^ temp;
    }
    if (decrypt) {
        var tmp;
        var m0 = imix[0];
        var m1 = imix[1];
        var m2 = imix[2];
        var m3 = imix[3];
        var wnew = w.slice(0);
        end = w.length;
        for (var i = 0, wi = end - Nb; i < end; i += Nb, wi -= Nb) {
            if (i === 0 || i === end - Nb) {
                wnew[i] = w[wi];
                wnew[i + 1] = w[wi + 3];
                wnew[i + 2] = w[wi + 2];
                wnew[i + 3] = w[wi + 1];
            } else {
                for (var n = 0; n < Nb; ++n) {
                    tmp = w[wi + n];
                    wnew[i + (3 & -n)] = m0[sbox[tmp >>> 24]] ^ m1[sbox[tmp >>> 16 & 255]] ^ m2[sbox[tmp >>> 8 & 255]] ^ m3[sbox[tmp & 255]];
                }
            }
        }
        w = wnew;
    }
    return w;
}

function _updateBlock(w, input, output, decrypt) {
    var Nr = w.length / 4 - 1;
    var m0, m1, m2, m3, sub;
    if (decrypt) {
        m0 = imix[0];
        m1 = imix[1];
        m2 = imix[2];
        m3 = imix[3];
        sub = isbox;
    } else {
        m0 = mix[0];
        m1 = mix[1];
        m2 = mix[2];
        m3 = mix[3];
        sub = sbox;
    }
    var a, b, c, d, a2, b2, c2;
    a = input[0] ^ w[0];
    b = input[decrypt ? 3 : 1] ^ w[1];
    c = input[2] ^ w[2];
    d = input[decrypt ? 1 : 3] ^ w[3];
    var i = 3;
    for (var round = 1; round < Nr; ++round) {
        a2 = m0[a >>> 24] ^ m1[b >>> 16 & 255] ^ m2[c >>> 8 & 255] ^ m3[d & 255] ^ w[++i];
        b2 = m0[b >>> 24] ^ m1[c >>> 16 & 255] ^ m2[d >>> 8 & 255] ^ m3[a & 255] ^ w[++i];
        c2 = m0[c >>> 24] ^ m1[d >>> 16 & 255] ^ m2[a >>> 8 & 255] ^ m3[b & 255] ^ w[++i];
        d = m0[d >>> 24] ^ m1[a >>> 16 & 255] ^ m2[b >>> 8 & 255] ^ m3[c & 255] ^ w[++i];
        a = a2;
        b = b2;
        c = c2;
    }
    output[0] = sub[a >>> 24] << 24 ^ sub[b >>> 16 & 255] << 16 ^ sub[c >>> 8 & 255] << 8 ^ sub[d & 255] ^ w[++i];
    output[decrypt ? 3 : 1] = sub[b >>> 24] << 24 ^ sub[c >>> 16 & 255] << 16 ^ sub[d >>> 8 & 255] << 8 ^ sub[a & 255] ^ w[++i];
    output[2] = sub[c >>> 24] << 24 ^ sub[d >>> 16 & 255] << 16 ^ sub[a >>> 8 & 255] << 8 ^ sub[b & 255] ^ w[++i];
    output[decrypt ? 1 : 3] = sub[d >>> 24] << 24 ^ sub[a >>> 16 & 255] << 16 ^ sub[b >>> 8 & 255] << 8 ^ sub[c & 255] ^ w[++i];
}

function _createCipher(options) {
    options = options || {};
    var mode = (options.mode || 'CBC').toUpperCase();
    var algorithm = 'AES-' + mode;
    var cipher;
    if (options.decrypt) {
        cipher = require('./cipher').createDecipher(algorithm, options.key);
    } else {
        cipher = require('./cipher').createCipher(algorithm, options.key);
    }
    var start = cipher.start;
    cipher.start = function(iv, options) {
        var output = null;
        if (options instanceof require('./util').ByteBuffer) {
            output = options;
            options = {};
        }
        options = options || {};
        options.output = output;
        options.iv = iv;
        start.call(cipher, options);
    };
    return cipher;
}

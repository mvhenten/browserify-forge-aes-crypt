var md5 = module.exports = module.exports || {};
var md = require('./md') || {};
md.algorithms = require('./md').algorithms || {};
md.md5 = require('./md').algorithms.md5 = md5;
md5.create = function() {
    if (!_initialized) {
        _init();
    }
    var _state = null;
    var _input = require('./util').createBuffer();
    var _w = new Array(16);
    var md = {
        algorithm: 'md5',
        blockLength: 64,
        digestLength: 16,
        messageLength: 0,
        messageLength64: [
                0,
                0
            ]
    };
    md.start = function() {
        md.messageLength = 0;
        md.messageLength64 = [
            0,
            0
        ];
        _input = require('./util').createBuffer();
        _state = {
            h0: 1732584193,
            h1: 4023233417,
            h2: 2562383102,
            h3: 271733878
        };
        return md;
    };
    md.start();
    md.update = function(msg, encoding) {
        if (encoding === 'utf8') {
            msg = require('./util').encodeUtf8(msg);
        }
        md.messageLength += msg.length;
        md.messageLength64[0] += msg.length / 4294967296 >>> 0;
        md.messageLength64[1] += msg.length >>> 0;
        _input.putBytes(msg);
        _update(_state, _w, _input);
        if (_input.read > 2048 || _input.length() === 0) {
            _input.compact();
        }
        return md;
    };
    md.digest = function() {
        var padBytes = require('./util').createBuffer();
        padBytes.putBytes(_input.bytes());
        padBytes.putBytes(_padding.substr(0, 64 - (md.messageLength64[1] + 8 & 63)));
        padBytes.putInt32Le(md.messageLength64[1] << 3);
        padBytes.putInt32Le(md.messageLength64[0] << 3 | md.messageLength64[0] >>> 28);
        var s2 = {
            h0: _state.h0,
            h1: _state.h1,
            h2: _state.h2,
            h3: _state.h3
        };
        _update(s2, _w, padBytes);
        var rval = require('./util').createBuffer();
        rval.putInt32Le(s2.h0);
        rval.putInt32Le(s2.h1);
        rval.putInt32Le(s2.h2);
        rval.putInt32Le(s2.h3);
        return rval;
    };
    return md;
};
var _padding = null;
var _g = null;
var _r = null;
var _k = null;
var _initialized = false;

function _init() {
    _padding = String.fromCharCode(128);
    _padding += require('./util').fillString(String.fromCharCode(0), 64);
    _g = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        1,
        6,
        11,
        0,
        5,
        10,
        15,
        4,
        9,
        14,
        3,
        8,
        13,
        2,
        7,
        12,
        5,
        8,
        11,
        14,
        1,
        4,
        7,
        10,
        13,
        0,
        3,
        6,
        9,
        12,
        15,
        2,
        0,
        7,
        14,
        5,
        12,
        3,
        10,
        1,
        8,
        15,
        6,
        13,
        4,
        11,
        2,
        9
    ];
    _r = [
        7,
        12,
        17,
        22,
        7,
        12,
        17,
        22,
        7,
        12,
        17,
        22,
        7,
        12,
        17,
        22,
        5,
        9,
        14,
        20,
        5,
        9,
        14,
        20,
        5,
        9,
        14,
        20,
        5,
        9,
        14,
        20,
        4,
        11,
        16,
        23,
        4,
        11,
        16,
        23,
        4,
        11,
        16,
        23,
        4,
        11,
        16,
        23,
        6,
        10,
        15,
        21,
        6,
        10,
        15,
        21,
        6,
        10,
        15,
        21,
        6,
        10,
        15,
        21
    ];
    _k = new Array(64);
    for (var i = 0; i < 64; ++i) {
        _k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
    }
    _initialized = true;
}

function _update(s, w, bytes) {
    var t, a, b, c, d, f, r, i;
    var len = bytes.length();
    while (len >= 64) {
        a = s.h0;
        b = s.h1;
        c = s.h2;
        d = s.h3;
        for (i = 0; i < 16; ++i) {
            w[i] = bytes.getInt32Le();
            f = d ^ b & (c ^ d);
            t = a + f + _k[i] + w[i];
            r = _r[i];
            a = d;
            d = c;
            c = b;
            b += t << r | t >>> 32 - r;
        }
        for (; i < 32; ++i) {
            f = c ^ d & (b ^ c);
            t = a + f + _k[i] + w[_g[i]];
            r = _r[i];
            a = d;
            d = c;
            c = b;
            b += t << r | t >>> 32 - r;
        }
        for (; i < 48; ++i) {
            f = b ^ c ^ d;
            t = a + f + _k[i] + w[_g[i]];
            r = _r[i];
            a = d;
            d = c;
            c = b;
            b += t << r | t >>> 32 - r;
        }
        for (; i < 64; ++i) {
            f = c ^ (b | ~d);
            t = a + f + _k[i] + w[_g[i]];
            r = _r[i];
            a = d;
            d = c;
            c = b;
            b += t << r | t >>> 32 - r;
        }
        s.h0 = s.h0 + a | 0;
        s.h1 = s.h1 + b | 0;
        s.h2 = s.h2 + c | 0;
        s.h3 = s.h3 + d | 0;
        len -= 64;
    }
}

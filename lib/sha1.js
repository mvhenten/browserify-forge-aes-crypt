var sha1 = module.exports = module.exports || {};
var md = require('./md') || {};
md.algorithms = require('./md').algorithms || {};
md.sha1 = require('./md').algorithms.sha1 = sha1;
sha1.create = function() {
    if (!_initialized) {
        _init();
    }
    var _state = null;
    var _input = require('./util').createBuffer();
    var _w = new Array(80);
    var md = {
        algorithm: 'sha1',
        blockLength: 64,
        digestLength: 20,
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
            h3: 271733878,
            h4: 3285377520
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
        padBytes.putInt32(md.messageLength64[0] << 3 | md.messageLength64[0] >>> 28);
        padBytes.putInt32(md.messageLength64[1] << 3);
        var s2 = {
            h0: _state.h0,
            h1: _state.h1,
            h2: _state.h2,
            h3: _state.h3,
            h4: _state.h4
        };
        _update(s2, _w, padBytes);
        var rval = require('./util').createBuffer();
        rval.putInt32(s2.h0);
        rval.putInt32(s2.h1);
        rval.putInt32(s2.h2);
        rval.putInt32(s2.h3);
        rval.putInt32(s2.h4);
        return rval;
    };
    return md;
};
var _padding = null;
var _initialized = false;

function _init() {
    _padding = String.fromCharCode(128);
    _padding += require('./util').fillString(String.fromCharCode(0), 64);
    _initialized = true;
}

function _update(s, w, bytes) {
    var t, a, b, c, d, e, f, i;
    var len = bytes.length();
    while (len >= 64) {
        a = s.h0;
        b = s.h1;
        c = s.h2;
        d = s.h3;
        e = s.h4;
        for (i = 0; i < 16; ++i) {
            t = bytes.getInt32();
            w[i] = t;
            f = d ^ b & (c ^ d);
            t = (a << 5 | a >>> 27) + f + e + 1518500249 + t;
            e = d;
            d = c;
            c = b << 30 | b >>> 2;
            b = a;
            a = t;
        }
        for (; i < 20; ++i) {
            t = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
            t = t << 1 | t >>> 31;
            w[i] = t;
            f = d ^ b & (c ^ d);
            t = (a << 5 | a >>> 27) + f + e + 1518500249 + t;
            e = d;
            d = c;
            c = b << 30 | b >>> 2;
            b = a;
            a = t;
        }
        for (; i < 32; ++i) {
            t = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
            t = t << 1 | t >>> 31;
            w[i] = t;
            f = b ^ c ^ d;
            t = (a << 5 | a >>> 27) + f + e + 1859775393 + t;
            e = d;
            d = c;
            c = b << 30 | b >>> 2;
            b = a;
            a = t;
        }
        for (; i < 40; ++i) {
            t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
            t = t << 2 | t >>> 30;
            w[i] = t;
            f = b ^ c ^ d;
            t = (a << 5 | a >>> 27) + f + e + 1859775393 + t;
            e = d;
            d = c;
            c = b << 30 | b >>> 2;
            b = a;
            a = t;
        }
        for (; i < 60; ++i) {
            t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
            t = t << 2 | t >>> 30;
            w[i] = t;
            f = b & c | d & (b ^ c);
            t = (a << 5 | a >>> 27) + f + e + 2400959708 + t;
            e = d;
            d = c;
            c = b << 30 | b >>> 2;
            b = a;
            a = t;
        }
        for (; i < 80; ++i) {
            t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
            t = t << 2 | t >>> 30;
            w[i] = t;
            f = b ^ c ^ d;
            t = (a << 5 | a >>> 27) + f + e + 3395469782 + t;
            e = d;
            d = c;
            c = b << 30 | b >>> 2;
            b = a;
            a = t;
        }
        s.h0 = s.h0 + a | 0;
        s.h1 = s.h1 + b | 0;
        s.h2 = s.h2 + c | 0;
        s.h3 = s.h3 + d | 0;
        s.h4 = s.h4 + e | 0;
        len -= 64;
    }
}

/*
 * Utility functions for web applications.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 */
var util = module.exports = module.exports || {};
if (typeof process === 'undefined' || !process.nextTick) {
    if (typeof setImmediate === 'function') {
        util.setImmediate = setImmediate;
        util.nextTick = function(callback) {
            return setImmediate(callback);
        };
    } else {
        util.setImmediate = function(callback) {
            setTimeout(callback, 0);
        };
        util.nextTick = util.setImmediate;
    }
} else {
    util.nextTick = process.nextTick;
    if (typeof setImmediate === 'function') {
        util.setImmediate = setImmediate;
    } else {
        util.setImmediate = util.nextTick;
    }
}
util.isArray = Array.isArray || function(x) {
    return Object.prototype.toString.call(x) === '[object Array]';
};
util.isArrayBuffer = function(x) {
    return typeof ArrayBuffer !== 'undefined' && x instanceof ArrayBuffer;
};
var _arrayBufferViews = [];
if (typeof DataView !== 'undefined') {
    _arrayBufferViews.push(DataView);
}
if (typeof Int8Array !== 'undefined') {
    _arrayBufferViews.push(Int8Array);
}
if (typeof Uint8Array !== 'undefined') {
    _arrayBufferViews.push(Uint8Array);
}
if (typeof Uint8ClampedArray !== 'undefined') {
    _arrayBufferViews.push(Uint8ClampedArray);
}
if (typeof Int16Array !== 'undefined') {
    _arrayBufferViews.push(Int16Array);
}
if (typeof Uint16Array !== 'undefined') {
    _arrayBufferViews.push(Uint16Array);
}
if (typeof Int32Array !== 'undefined') {
    _arrayBufferViews.push(Int32Array);
}
if (typeof Uint32Array !== 'undefined') {
    _arrayBufferViews.push(Uint32Array);
}
if (typeof Float32Array !== 'undefined') {
    _arrayBufferViews.push(Float32Array);
}
if (typeof Float64Array !== 'undefined') {
    _arrayBufferViews.push(Float64Array);
}
util.isArrayBufferView = function(x) {
    for (var i = 0; i < _arrayBufferViews.length; ++i) {
        if (x instanceof _arrayBufferViews[i]) {
            return true;
        }
    }
    return false;
};
util.ByteBuffer = ByteStringBuffer;

function ByteStringBuffer(b) {
    this.data = '';
    this.read = 0;
    if (typeof b === 'string') {
        this.data = b;
    } else if (util.isArrayBuffer(b) || util.isArrayBufferView(b)) {
        var arr = new Uint8Array(b);
        try {
            this.data = String.fromCharCode.apply(null, arr);
        } catch (e) {
            for (var i = 0; i < arr.length; ++i) {
                this.putByte(arr[i]);
            }
        }
    } else if (b instanceof ByteStringBuffer || typeof b === 'object' && typeof b.data === 'string' && typeof b.read === 'number') {
        this.data = b.data;
        this.read = b.read;
    }
}
util.ByteStringBuffer = ByteStringBuffer;
util.ByteStringBuffer.prototype.length = function() {
    return this.data.length - this.read;
};
util.ByteStringBuffer.prototype.isEmpty = function() {
    return this.length() <= 0;
};
util.ByteStringBuffer.prototype.putByte = function(b) {
    this.data += String.fromCharCode(b);
    return this;
};
util.ByteStringBuffer.prototype.fillWithByte = function(b, n) {
    b = String.fromCharCode(b);
    var d = this.data;
    while (n > 0) {
        if (n & 1) {
            d += b;
        }
        n >>>= 1;
        if (n > 0) {
            b += b;
        }
    }
    this.data = d;
    return this;
};
util.ByteStringBuffer.prototype.putBytes = function(bytes) {
    this.data += bytes;
    return this;
};
util.ByteStringBuffer.prototype.putString = function(str) {
    this.data += util.encodeUtf8(str);
    return this;
};
util.ByteStringBuffer.prototype.putInt16 = function(i) {
    this.data += String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
    return this;
};
util.ByteStringBuffer.prototype.putInt24 = function(i) {
    this.data += String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
    return this;
};
util.ByteStringBuffer.prototype.putInt32 = function(i) {
    this.data += String.fromCharCode(i >> 24 & 255) + String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
    return this;
};
util.ByteStringBuffer.prototype.putInt16Le = function(i) {
    this.data += String.fromCharCode(i & 255) + String.fromCharCode(i >> 8 & 255);
    return this;
};
util.ByteStringBuffer.prototype.putInt24Le = function(i) {
    this.data += String.fromCharCode(i & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i >> 16 & 255);
    return this;
};
util.ByteStringBuffer.prototype.putInt32Le = function(i) {
    this.data += String.fromCharCode(i & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 24 & 255);
    return this;
};
util.ByteStringBuffer.prototype.putInt = function(i, n) {
    do {
        n -= 8;
        this.data += String.fromCharCode(i >> n & 255);
    } while (n > 0);
    return this;
};
util.ByteStringBuffer.prototype.putSignedInt = function(i, n) {
    if (i < 0) {
        i += 2 << n - 1;
    }
    return this.putInt(i, n);
};
util.ByteStringBuffer.prototype.putBuffer = function(buffer) {
    this.data += buffer.getBytes();
    return this;
};
util.ByteStringBuffer.prototype.getByte = function() {
    return this.data.charCodeAt(this.read++);
};
util.ByteStringBuffer.prototype.getInt16 = function() {
    var rval = this.data.charCodeAt(this.read) << 8 ^ this.data.charCodeAt(this.read + 1);
    this.read += 2;
    return rval;
};
util.ByteStringBuffer.prototype.getInt24 = function() {
    var rval = this.data.charCodeAt(this.read) << 16 ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2);
    this.read += 3;
    return rval;
};
util.ByteStringBuffer.prototype.getInt32 = function() {
    var rval = this.data.charCodeAt(this.read) << 24 ^ this.data.charCodeAt(this.read + 1) << 16 ^ this.data.charCodeAt(this.read + 2) << 8 ^ this.data.charCodeAt(this.read + 3);
    this.read += 4;
    return rval;
};
util.ByteStringBuffer.prototype.getInt16Le = function() {
    var rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8;
    this.read += 2;
    return rval;
};
util.ByteStringBuffer.prototype.getInt24Le = function() {
    var rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16;
    this.read += 3;
    return rval;
};
util.ByteStringBuffer.prototype.getInt32Le = function() {
    var rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16 ^ this.data.charCodeAt(this.read + 3) << 24;
    this.read += 4;
    return rval;
};
util.ByteStringBuffer.prototype.getInt = function(n) {
    var rval = 0;
    do {
        rval = (rval << 8) + this.data.charCodeAt(this.read++);
        n -= 8;
    } while (n > 0);
    return rval;
};
util.ByteStringBuffer.prototype.getSignedInt = function(n) {
    var x = this.getInt(n);
    var max = 2 << n - 2;
    if (x >= max) {
        x -= max << 1;
    }
    return x;
};
util.ByteStringBuffer.prototype.getBytes = function(count) {
    var rval;
    if (count) {
        count = Math.min(this.length(), count);
        rval = this.data.slice(this.read, this.read + count);
        this.read += count;
    } else if (count === 0) {
        rval = '';
    } else {
        rval = this.read === 0 ? this.data : this.data.slice(this.read);
        this.clear();
    }
    return rval;
};
util.ByteStringBuffer.prototype.bytes = function(count) {
    return typeof count === 'undefined' ? this.data.slice(this.read) : this.data.slice(this.read, this.read + count);
};
util.ByteStringBuffer.prototype.at = function(i) {
    return this.data.charCodeAt(this.read + i);
};
util.ByteStringBuffer.prototype.setAt = function(i, b) {
    this.data = this.data.substr(0, this.read + i) + String.fromCharCode(b) + this.data.substr(this.read + i + 1);
    return this;
};
util.ByteStringBuffer.prototype.last = function() {
    return this.data.charCodeAt(this.data.length - 1);
};
util.ByteStringBuffer.prototype.copy = function() {
    var c = util.createBuffer(this.data);
    c.read = this.read;
    return c;
};
util.ByteStringBuffer.prototype.compact = function() {
    if (this.read > 0) {
        this.data = this.data.slice(this.read);
        this.read = 0;
    }
    return this;
};
util.ByteStringBuffer.prototype.clear = function() {
    this.data = '';
    this.read = 0;
    return this;
};
util.ByteStringBuffer.prototype.truncate = function(count) {
    var len = Math.max(0, this.length() - count);
    this.data = this.data.substr(this.read, len);
    this.read = 0;
    return this;
};
util.ByteStringBuffer.prototype.toHex = function() {
    var rval = '';
    for (var i = this.read; i < this.data.length; ++i) {
        var b = this.data.charCodeAt(i);
        if (b < 16) {
            rval += '0';
        }
        rval += b.toString(16);
    }
    return rval;
};
util.ByteStringBuffer.prototype.toString = function() {
    return util.decodeUtf8(this.bytes());
};

function DataBuffer(b, options) {
    options = options || {};
    this.read = options.readOffset || 0;
    this.growSize = options.growSize || 1024;
    var isArrayBuffer = util.isArrayBuffer(b);
    var isArrayBufferView = util.isArrayBufferView(b);
    if (isArrayBuffer || isArrayBufferView) {
        if (isArrayBuffer) {
            this.data = new DataView(b);
        } else {
            this.data = new DataView(b.buffer, b.byteOffset, b.byteLength);
        }
        this.write = 'writeOffset' in options ? options.writeOffset : this.data.byteLength;
        return;
    }
    this.data = new DataView(new ArrayBuffer(0));
    this.write = 0;
    if (b !== null && b !== undefined) {
        this.putBytes(b);
    }
    if ('writeOffset' in options) {
        this.write = options.writeOffset;
    }
}
util.DataBuffer = DataBuffer;
util.DataBuffer.prototype.length = function() {
    return this.write - this.read;
};
util.DataBuffer.prototype.isEmpty = function() {
    return this.length() <= 0;
};
util.DataBuffer.prototype.accommodate = function(amount, growSize) {
    if (this.length() >= amount) {
        return this;
    }
    growSize = Math.max(growSize || this.growSize, amount);
    var src = new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength);
    var dst = new Uint8Array(this.length() + growSize);
    dst.set(src);
    this.data = new DataView(dst.buffer);
    return this;
};
util.DataBuffer.prototype.putByte = function(b) {
    this.accommodate(1);
    this.data.setUint8(this.write++, b);
    return this;
};
util.DataBuffer.prototype.fillWithByte = function(b, n) {
    this.accommodate(n);
    for (var i = 0; i < n; ++i) {
        this.data.setUint8(b);
    }
    return this;
};
util.DataBuffer.prototype.putBytes = function(bytes, encoding) {
    if (util.isArrayBufferView(bytes)) {
        var src = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        var len = src.byteLength - src.byteOffset;
        this.accommodate(len);
        var dst = new Uint8Array(this.data.buffer, this.write);
        dst.set(src);
        this.write += len;
        return this;
    }
    if (util.isArrayBuffer(bytes)) {
        var src = new Uint8Array(bytes);
        this.accommodate(src.byteLength);
        var dst = new Uint8Array(this.data.buffer);
        dst.set(src, this.write);
        this.write += src.byteLength;
        return this;
    }
    if (bytes instanceof util.DataBuffer || typeof bytes === 'object' && typeof bytes.read === 'number' && typeof bytes.write === 'number' && util.isArrayBufferView(bytes.data)) {
        var src = new Uint8Array(bytes.data.byteLength, bytes.read, bytes.length());
        this.accommodate(src.byteLength);
        var dst = new Uint8Array(bytes.data.byteLength, this.write);
        dst.set(src);
        this.write += src.byteLength;
        return this;
    }
    if (bytes instanceof util.ByteStringBuffer) {
        bytes = bytes.data;
        encoding = 'binary';
    }
    encoding = encoding || 'binary';
    if (typeof bytes === 'string') {
        var view;
        if (encoding === 'hex') {
            this.accommodate(Math.ceil(bytes.length / 2));
            view = new Uint8Array(this.data.buffer, this.write);
            this.write += util.binary.hex.decode(bytes, view, this.write);
            return this;
        }
        if (encoding === 'base64') {
            this.accommodate(Math.ceil(bytes.length / 4) * 3);
            view = new Uint8Array(this.data.buffer, this.write);
            this.write += util.binary.base64.decode(bytes, view, this.write);
            return this;
        }
        if (encoding === 'utf8') {
            bytes = util.encodeUtf8(bytes);
            encoding = 'binary';
        }
        if (encoding === 'binary' || encoding === 'raw') {
            this.accommodate(bytes.length);
            view = new Uint8Array(this.data.buffer, this.write);
            this.write += util.binary.raw.decode(view);
            return this;
        }
        if (encoding === 'utf16') {
            this.accommodate(bytes.length * 2);
            view = new Uint16Array(this.data.buffer, this.write);
            this.write += util.text.utf16.encode(view);
            return this;
        }
        throw new Error('Invalid encoding: ' + encoding);
    }
    throw Error('Invalid parameter: ' + bytes);
};
util.DataBuffer.prototype.putBuffer = function(buffer) {
    this.putBytes(buffer);
    buffer.clear();
    return this;
};
util.DataBuffer.prototype.putString = function(str) {
    return this.putBytes(str, 'utf16');
};
util.DataBuffer.prototype.putInt16 = function(i) {
    this.accommodate(2);
    this.data.setInt16(this.write, i);
    this.write += 2;
    return this;
};
util.DataBuffer.prototype.putInt24 = function(i) {
    this.accommodate(3);
    this.data.setInt16(this.write, i >> 8 & 65535);
    this.data.setInt8(this.write, i >> 16 & 255);
    this.write += 3;
    return this;
};
util.DataBuffer.prototype.putInt32 = function(i) {
    this.accommodate(4);
    this.data.setInt32(this.write, i);
    this.write += 4;
    return this;
};
util.DataBuffer.prototype.putInt16Le = function(i) {
    this.accommodate(2);
    this.data.setInt16(this.write, i, true);
    this.write += 2;
    return this;
};
util.DataBuffer.prototype.putInt24Le = function(i) {
    this.accommodate(3);
    this.data.setInt8(this.write, i >> 16 & 255);
    this.data.setInt16(this.write, i >> 8 & 65535, true);
    this.write += 3;
    return this;
};
util.DataBuffer.prototype.putInt32Le = function(i) {
    this.accommodate(4);
    this.data.setInt32(this.write, i, true);
    this.write += 4;
    return this;
};
util.DataBuffer.prototype.putInt = function(i, n) {
    this.accommodate(n / 8);
    do {
        n -= 8;
        this.data.setInt8(this.write++, i >> n & 255);
    } while (n > 0);
    return this;
};
util.DataBuffer.prototype.putSignedInt = function(i, n) {
    this.accommodate(n / 8);
    if (i < 0) {
        i += 2 << n - 1;
    }
    return this.putInt(i, n);
};
util.DataBuffer.prototype.getByte = function() {
    return this.data.getInt8(this.read++);
};
util.DataBuffer.prototype.getInt16 = function() {
    var rval = this.data.getInt16(this.read);
    this.read += 2;
    return rval;
};
util.DataBuffer.prototype.getInt24 = function() {
    var rval = this.data.getInt16(this.read) << 8 ^ this.data.getInt8(this.read + 2);
    this.read += 3;
    return rval;
};
util.DataBuffer.prototype.getInt32 = function() {
    var rval = this.data.getInt32(this.read);
    this.read += 4;
    return rval;
};
util.DataBuffer.prototype.getInt16Le = function() {
    var rval = this.data.getInt16(this.read, true);
    this.read += 2;
    return rval;
};
util.DataBuffer.prototype.getInt24Le = function() {
    var rval = this.data.getInt8(this.read) ^ this.data.getInt16(this.read + 1, true) << 8;
    this.read += 3;
    return rval;
};
util.DataBuffer.prototype.getInt32Le = function() {
    var rval = this.data.getInt32(this.read, true);
    this.read += 4;
    return rval;
};
util.DataBuffer.prototype.getInt = function(n) {
    var rval = 0;
    do {
        rval = (rval << 8) + this.data.getInt8(this.read++);
        n -= 8;
    } while (n > 0);
    return rval;
};
util.DataBuffer.prototype.getSignedInt = function(n) {
    var x = this.getInt(n);
    var max = 2 << n - 2;
    if (x >= max) {
        x -= max << 1;
    }
    return x;
};
util.DataBuffer.prototype.getBytes = function(count) {
    var rval;
    if (count) {
        count = Math.min(this.length(), count);
        rval = this.data.slice(this.read, this.read + count);
        this.read += count;
    } else if (count === 0) {
        rval = '';
    } else {
        rval = this.read === 0 ? this.data : this.data.slice(this.read);
        this.clear();
    }
    return rval;
};
util.DataBuffer.prototype.bytes = function(count) {
    return typeof count === 'undefined' ? this.data.slice(this.read) : this.data.slice(this.read, this.read + count);
};
util.DataBuffer.prototype.at = function(i) {
    return this.data.getUint8(this.read + i);
};
util.DataBuffer.prototype.setAt = function(i, b) {
    this.data.setUint8(i, b);
    return this;
};
util.DataBuffer.prototype.last = function() {
    return this.data.getUint8(this.write - 1);
};
util.DataBuffer.prototype.copy = function() {
    return new util.DataBuffer(this);
};
util.DataBuffer.prototype.compact = function() {
    if (this.read > 0) {
        var src = new Uint8Array(this.data.buffer, this.read);
        var dst = new Uint8Array(src.byteLength);
        dst.set(src);
        this.data = new DataView(dst);
        this.write -= this.read;
        this.read = 0;
    }
    return this;
};
util.DataBuffer.prototype.clear = function() {
    this.data = new DataView(new ArrayBuffer(0));
    this.read = this.write = 0;
    return this;
};
util.DataBuffer.prototype.truncate = function(count) {
    this.write = Math.max(0, this.length() - count);
    this.read = Math.min(this.read, this.write);
    return this;
};
util.DataBuffer.prototype.toHex = function() {
    var rval = '';
    for (var i = this.read; i < this.data.byteLength; ++i) {
        var b = this.data.getUint8(i);
        if (b < 16) {
            rval += '0';
        }
        rval += b.toString(16);
    }
    return rval;
};
util.DataBuffer.prototype.toString = function(encoding) {
    var view = new Uint8Array(this.data, this.read, this.length());
    encoding = encoding || 'utf8';
    if (encoding === 'binary' || encoding === 'raw') {
        return util.binary.raw.encode(view);
    }
    if (encoding === 'hex') {
        return util.binary.hex.encode(view);
    }
    if (encoding === 'base64') {
        return util.binary.base64.encode(view);
    }
    if (encoding === 'utf8') {
        return util.text.utf8.decode(view);
    }
    if (encoding === 'utf16') {
        return util.text.utf16.decode(view);
    }
    throw new Error('Invalid encoding: ' + encoding);
};
util.createBuffer = function(input, encoding) {
    encoding = encoding || 'raw';
    if (input !== undefined && encoding === 'utf8') {
        input = util.encodeUtf8(input);
    }
    return new util.ByteBuffer(input);
};
util.fillString = function(c, n) {
    var s = '';
    while (n > 0) {
        if (n & 1) {
            s += c;
        }
        n >>>= 1;
        if (n > 0) {
            c += c;
        }
    }
    return s;
};
util.xorBytes = function(s1, s2, n) {
    var s3 = '';
    var b = '';
    var t = '';
    var i = 0;
    var c = 0;
    for (; n > 0; --n, ++i) {
        b = s1.charCodeAt(i) ^ s2.charCodeAt(i);
        if (c >= 10) {
            s3 += t;
            t = '';
            c = 0;
        }
        t += String.fromCharCode(b);
        ++c;
    }
    s3 += t;
    return s3;
};
util.hexToBytes = function(hex) {
    var rval = '';
    var i = 0;
    if (hex.length & 1 == 1) {
        i = 1;
        rval += String.fromCharCode(parseInt(hex[0], 16));
    }
    for (; i < hex.length; i += 2) {
        rval += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return rval;
};
util.bytesToHex = function(bytes) {
    return util.createBuffer(bytes).toHex();
};
util.int32ToBytes = function(i) {
    return String.fromCharCode(i >> 24 & 255) + String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
};
var _base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var _base64Idx = [
        62,
        -1,
        -1,
        -1,
        63,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        -1,
        -1,
        -1,
        64,
        -1,
        -1,
        -1,
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
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51
    ];
util.encode64 = function(input, maxline) {
    var line = '';
    var output = '';
    var chr1, chr2, chr3;
    var i = 0;
    while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        line += _base64.charAt(chr1 >> 2);
        line += _base64.charAt((chr1 & 3) << 4 | chr2 >> 4);
        if (isNaN(chr2)) {
            line += '==';
        } else {
            line += _base64.charAt((chr2 & 15) << 2 | chr3 >> 6);
            line += isNaN(chr3) ? '=' : _base64.charAt(chr3 & 63);
        }
        if (maxline && line.length > maxline) {
            output += line.substr(0, maxline) + '\r\n';
            line = line.substr(maxline);
        }
    }
    output += line;
    return output;
};
util.decode64 = function(input) {
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    var output = '';
    var enc1, enc2, enc3, enc4;
    var i = 0;
    while (i < input.length) {
        enc1 = _base64Idx[input.charCodeAt(i++) - 43];
        enc2 = _base64Idx[input.charCodeAt(i++) - 43];
        enc3 = _base64Idx[input.charCodeAt(i++) - 43];
        enc4 = _base64Idx[input.charCodeAt(i++) - 43];
        output += String.fromCharCode(enc1 << 2 | enc2 >> 4);
        if (enc3 !== 64) {
            output += String.fromCharCode((enc2 & 15) << 4 | enc3 >> 2);
            if (enc4 !== 64) {
                output += String.fromCharCode((enc3 & 3) << 6 | enc4);
            }
        }
    }
    return output;
};
util.encodeUtf8 = function(str) {
    return unescape(encodeURIComponent(str));
};
util.decodeUtf8 = function(str) {
    return decodeURIComponent(escape(str));
};
util.binary = {
    raw: {},
    hex: {},
    base64: {}
};
util.binary.raw.encode = function(bytes) {
    return String.fromCharCode.apply(null, bytes);
};
util.binary.raw.decode = function(str, output, offset) {
    var out = output;
    if (!out) {
        out = new Uint8Array(str.length);
    }
    offset = offset || 0;
    var j = offset;
    for (var i = 0; i < str.length; ++i) {
        out[j++] = str.charCodeAt(i);
    }
    return output ? j - offset : out;
};
util.binary.hex.encode = util.bytesToHex;
util.binary.hex.decode = function(hex, output, offset) {
    var out = output;
    if (!out) {
        out = new Uint8Array(Math.ceil(hex.length / 2));
    }
    offset = offset || 0;
    var i = 0,
        j = offset;
    if (hex.length & 1) {
        i = 1;
        output[j++] = parseInt(hex[0], 16);
    }
    for (; i < hex.length; i += 2) {
        output[j++] = parseInt(hex.substr(i, 2), 16);
    }
    return output ? j - offset : output;
};
util.binary.base64.encode = function(input, maxline) {
    var line = '';
    var output = '';
    var chr1, chr2, chr3;
    var i = 0;
    while (i < input.byteLength) {
        chr1 = input[i++];
        chr2 = input[i++];
        chr3 = input[i++];
        line += _base64.charAt(chr1 >> 2);
        line += _base64.charAt((chr1 & 3) << 4 | chr2 >> 4);
        if (isNaN(chr2)) {
            line += '==';
        } else {
            line += _base64.charAt((chr2 & 15) << 2 | chr3 >> 6);
            line += isNaN(chr3) ? '=' : _base64.charAt(chr3 & 63);
        }
        if (maxline && line.length > maxline) {
            output += line.substr(0, maxline) + '\r\n';
            line = line.substr(maxline);
        }
    }
    output += line;
    return output;
};
util.binary.base64.decode = function(input, output, offset) {
    var out = output;
    if (!out) {
        out = new Uint8Array(Math.ceil(input.length / 4) * 3);
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    offset = offset || 0;
    var enc1, enc2, enc3, enc4;
    var i = 0,
        j = offset;
    while (i < input.length) {
        enc1 = _base64Idx[input.charCodeAt(i++) - 43];
        enc2 = _base64Idx[input.charCodeAt(i++) - 43];
        enc3 = _base64Idx[input.charCodeAt(i++) - 43];
        enc4 = _base64Idx[input.charCodeAt(i++) - 43];
        output[j++] = enc1 << 2 | enc2 >> 4;
        if (enc3 !== 64) {
            output[j++] = (enc2 & 15) << 4 | enc3 >> 2;
            if (enc4 !== 64) {
                output[j++] = (enc3 & 3) << 6 | enc4;
            }
        }
    }
    return output ? j - offset : output;
};
util.text = {
    utf8: {},
    utf16: {}
};
util.text.utf8.encode = function(str, output, offset) {
    str = util.encodeUtf8(str);
    var out = output;
    if (!out) {
        out = new Uint8Array(str.length);
    }
    offset = offset || 0;
    var j = offset;
    for (var i = 0; i < str.length; ++i) {
        out[j++] = str.charCodeAt(i);
    }
    return output ? j - offset : out;
};
util.text.utf8.decode = function(bytes) {
    return util.decodeUtf8(String.fromCharCode.apply(null, bytes));
};
util.text.utf16.encode = function(str, output, offset) {
    var out = output;
    if (!out) {
        out = new Uint8Array(str.length);
    }
    var view = new Uint16Array(out);
    offset = offset || 0;
    var j = offset;
    var k = offset;
    for (var i = 0; i < str.length; ++i) {
        view[k++] = str.charCodeAt(i);
        j += 2;
    }
    return output ? j - offset : out;
};
util.text.utf16.decode = function(bytes) {
    return String.fromCharCode.apply(null, new Uint16Array(bytes));
};
util.deflate = function(api, bytes, raw) {
    bytes = util.decode64(api.deflate(util.encode64(bytes)).rval);
    if (raw) {
        var start = 2;
        var flg = bytes.charCodeAt(1);
        if (flg & 32) {
            start = 6;
        }
        bytes = bytes.substring(start, bytes.length - 4);
    }
    return bytes;
};
util.inflate = function(api, bytes, raw) {
    var rval = api.inflate(util.encode64(bytes)).rval;
    return rval === null ? null : util.decode64(rval);
};
var _setStorageObject = function(api, id, obj) {
    if (!api) {
        throw new Error('WebStorage not available.');
    }
    var rval;
    if (obj === null) {
        rval = api.removeItem(id);
    } else {
        obj = util.encode64(JSON.stringify(obj));
        rval = api.setItem(id, obj);
    }
    if (typeof rval !== 'undefined' && rval.rval !== true) {
        var error = new Error(rval.error.message);
        error.id = rval.error.id;
        error.name = rval.error.name;
        throw error;
    }
};
var _getStorageObject = function(api, id) {
    if (!api) {
        throw new Error('WebStorage not available.');
    }
    var rval = api.getItem(id);
    if (api.init) {
        if (rval.rval === null) {
            if (rval.error) {
                var error = new Error(rval.error.message);
                error.id = rval.error.id;
                error.name = rval.error.name;
                throw error;
            }
            rval = null;
        } else {
            rval = rval.rval;
        }
    }
    if (rval !== null) {
        rval = JSON.parse(util.decode64(rval));
    }
    return rval;
};
var _setItem = function(api, id, key, data) {
    var obj = _getStorageObject(api, id);
    if (obj === null) {
        obj = {};
    }
    obj[key] = data;
    _setStorageObject(api, id, obj);
};
var _getItem = function(api, id, key) {
    var rval = _getStorageObject(api, id);
    if (rval !== null) {
        rval = key in rval ? rval[key] : null;
    }
    return rval;
};
var _removeItem = function(api, id, key) {
    var obj = _getStorageObject(api, id);
    if (obj !== null && key in obj) {
        delete obj[key];
        var empty = true;
        for (var prop in obj) {
            empty = false;
            break;
        }
        if (empty) {
            obj = null;
        }
        _setStorageObject(api, id, obj);
    }
};
var _clearItems = function(api, id) {
    _setStorageObject(api, id, null);
};
var _callStorageFunction = function(func, args, location) {
    var rval = null;
    if (typeof location === 'undefined') {
        location = [
            'web',
            'flash'
        ];
    }
    var type;
    var done = false;
    var exception = null;
    for (var idx in location) {
        type = location[idx];
        try {
            if (type === 'flash' || type === 'both') {
                if (args[0] === null) {
                    throw new Error('Flash local storage not available.');
                }
                rval = func.apply(this, args);
                done = type === 'flash';
            }
            if (type === 'web' || type === 'both') {
                args[0] = localStorage;
                rval = func.apply(this, args);
                done = true;
            }
        } catch (ex) {
            exception = ex;
        }
        if (done) {
            break;
        }
    }
    if (!done) {
        throw exception;
    }
    return rval;
};
util.setItem = function(api, id, key, data, location) {
    _callStorageFunction(_setItem, arguments, location);
};
util.getItem = function(api, id, key, location) {
    return _callStorageFunction(_getItem, arguments, location);
};
util.removeItem = function(api, id, key, location) {
    _callStorageFunction(_removeItem, arguments, location);
};
util.clearItems = function(api, id, location) {
    _callStorageFunction(_clearItems, arguments, location);
};
util.parseUrl = function(str) {
    var regex = /^(https?):\/\/([^:&^\/]*):?(\d*)(.*)$/g;
    regex.lastIndex = 0;
    var m = regex.exec(str);
    var url = m === null ? null : {
        full: str,
        scheme: m[1],
        host: m[2],
        port: m[3],
        path: m[4]
    };
    if (url) {
        url.fullHost = url.host;
        if (url.port) {
            if (url.port !== 80 && url.scheme === 'http') {
                url.fullHost += ':' + url.port;
            } else if (url.port !== 443 && url.scheme === 'https') {
                url.fullHost += ':' + url.port;
            }
        } else if (url.scheme === 'http') {
            url.port = 80;
        } else if (url.scheme === 'https') {
            url.port = 443;
        }
        url.full = url.scheme + '://' + url.fullHost;
    }
    return url;
};
var _queryVariables = null;
util.getQueryVariables = function(query) {
    var parse = function(q) {
        var rval = {};
        var kvpairs = q.split('&');
        for (var i = 0; i < kvpairs.length; i++) {
            var pos = kvpairs[i].indexOf('=');
            var key;
            var val;
            if (pos > 0) {
                key = kvpairs[i].substring(0, pos);
                val = kvpairs[i].substring(pos + 1);
            } else {
                key = kvpairs[i];
                val = null;
            }
            if (!(key in rval)) {
                rval[key] = [];
            }
            if (!(key in Object.prototype) && val !== null) {
                rval[key].push(unescape(val));
            }
        }
        return rval;
    };
    var rval;
    if (typeof query === 'undefined') {
        if (_queryVariables === null) {
            if (typeof window === 'undefined') {
                _queryVariables = {};
            } else {
                _queryVariables = parse(window.location.search.substring(1));
            }
        }
        rval = _queryVariables;
    } else {
        rval = parse(query);
    }
    return rval;
};
util.parseFragment = function(fragment) {
    var fp = fragment;
    var fq = '';
    var pos = fragment.indexOf('?');
    if (pos > 0) {
        fp = fragment.substring(0, pos);
        fq = fragment.substring(pos + 1);
    }
    var path = fp.split('/');
    if (path.length > 0 && path[0] === '') {
        path.shift();
    }
    var query = fq === '' ? {} : util.getQueryVariables(fq);
    return {
        pathString: fp,
        queryString: fq,
        path: path,
        query: query
    };
};
util.makeRequest = function(reqString) {
    var frag = util.parseFragment(reqString);
    var req = {
        path: frag.pathString,
        query: frag.queryString,
        getPath: function(i) {
            return typeof i === 'undefined' ? frag.path : frag.path[i];
        },
        getQuery: function(k, i) {
            var rval;
            if (typeof k === 'undefined') {
                rval = frag.query;
            } else {
                rval = frag.query[k];
                if (rval && typeof i !== 'undefined') {
                    rval = rval[i];
                }
            }
            return rval;
        },
        getQueryLast: function(k, _default) {
            var rval;
            var vals = req.getQuery(k);
            if (vals) {
                rval = vals[vals.length - 1];
            } else {
                rval = _default;
            }
            return rval;
        }
    };
    return req;
};
util.makeLink = function(path, query, fragment) {
    path = jQuery.isArray(path) ? path.join('/') : path;
    var qstr = jQuery.param(query || {});
    fragment = fragment || '';
    return path + (qstr.length > 0 ? '?' + qstr : '') + (fragment.length > 0 ? '#' + fragment : '');
};
util.setPath = function(object, keys, value) {
    if (typeof object === 'object' && object !== null) {
        var i = 0;
        var len = keys.length;
        while (i < len) {
            var next = keys[i++];
            if (i == len) {
                object[next] = value;
            } else {
                var hasNext = next in object;
                if (!hasNext || hasNext && typeof object[next] !== 'object' || hasNext && object[next] === null) {
                    object[next] = {};
                }
                object = object[next];
            }
        }
    }
};
util.getPath = function(object, keys, _default) {
    var i = 0;
    var len = keys.length;
    var hasNext = true;
    while (hasNext && i < len && typeof object === 'object' && object !== null) {
        var next = keys[i++];
        hasNext = next in object;
        if (hasNext) {
            object = object[next];
        }
    }
    return hasNext ? object : _default;
};
util.deletePath = function(object, keys) {
    if (typeof object === 'object' && object !== null) {
        var i = 0;
        var len = keys.length;
        while (i < len) {
            var next = keys[i++];
            if (i == len) {
                delete object[next];
            } else {
                if (!(next in object) || typeof object[next] !== 'object' || object[next] === null) {
                    break;
                }
                object = object[next];
            }
        }
    }
};
util.isEmpty = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    return true;
};
util.format = function(format) {
    var re = /%./g;
    var match;
    var part;
    var argi = 0;
    var parts = [];
    var last = 0;
    while (match = re.exec(format)) {
        part = format.substring(last, re.lastIndex - 2);
        if (part.length > 0) {
            parts.push(part);
        }
        last = re.lastIndex;
        var code = match[0][1];
        switch (code) {
            case 's':
            case 'o':
                if (argi < arguments.length) {
                    parts.push(arguments[argi+++1]);
                } else {
                    parts.push('<?>');
                }
                break;
            case '%':
                parts.push('%');
                break;
            default:
                parts.push('<%' + code + '?>');
        }
    }
    parts.push(format.substring(last));
    return parts.join('');
};
util.formatNumber = function(number, decimals, dec_point, thousands_sep) {
    var n = number,
        c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
    var d = dec_point === undefined ? ',' : dec_point;
    var t = thousands_sep === undefined ? '.' : thousands_sep,
        s = n < 0 ? '-' : '';
    var i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10) + '';
    var j = i.length > 3 ? i.length % 3 : 0;
    return s + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
};
util.formatSize = function(size) {
    if (size >= 1073741824) {
        size = util.formatNumber(size / 1073741824, 2, '.', '') + ' GiB';
    } else if (size >= 1048576) {
        size = util.formatNumber(size / 1048576, 2, '.', '') + ' MiB';
    } else if (size >= 1024) {
        size = util.formatNumber(size / 1024, 0) + ' KiB';
    } else {
        size = util.formatNumber(size, 0) + ' bytes';
    }
    return size;
};
util.bytesFromIP = function(ip) {
    if (ip.indexOf('.') !== -1) {
        return util.bytesFromIPv4(ip);
    }
    if (ip.indexOf(':') !== -1) {
        return util.bytesFromIPv6(ip);
    }
    return null;
};
util.bytesFromIPv4 = function(ip) {
    ip = ip.split('.');
    if (ip.length !== 4) {
        return null;
    }
    var b = util.createBuffer();
    for (var i = 0; i < ip.length; ++i) {
        var num = parseInt(ip[i], 10);
        if (isNaN(num)) {
            return null;
        }
        b.putByte(num);
    }
    return b.getBytes();
};
util.bytesFromIPv6 = function(ip) {
    var blanks = 0;
    ip = ip.split(':').filter(function(e) {
        if (e.length === 0)
        ++blanks;
        return true;
    });
    var zeros = (8 - ip.length + blanks) * 2;
    var b = util.createBuffer();
    for (var i = 0; i < 8; ++i) {
        if (!ip[i] || ip[i].length === 0) {
            b.fillWithByte(0, zeros);
            zeros = 0;
            continue;
        }
        var bytes = util.hexToBytes(ip[i]);
        if (bytes.length < 2) {
            b.putByte(0);
        }
        b.putBytes(bytes);
    }
    return b.getBytes();
};
util.bytesToIP = function(bytes) {
    if (bytes.length === 4) {
        return util.bytesToIPv4(bytes);
    }
    if (bytes.length === 16) {
        return util.bytesToIPv6(bytes);
    }
    return null;
};
util.bytesToIPv4 = function(bytes) {
    if (bytes.length !== 4) {
        return null;
    }
    var ip = [];
    for (var i = 0; i < bytes.length; ++i) {
        ip.push(bytes.charCodeAt(i));
    }
    return ip.join('.');
};
util.bytesToIPv6 = function(bytes) {
    if (bytes.length !== 16) {
        return null;
    }
    var ip = [];
    var zeroGroups = [];
    var zeroMaxGroup = 0;
    for (var i = 0; i < bytes.length; i += 2) {
        var hex = util.bytesToHex(bytes[i] + bytes[i + 1]);
        while (hex[0] === '0' && hex !== '0') {
            hex = hex.substr(1);
        }
        if (hex === '0') {
            var last = zeroGroups[zeroGroups.length - 1];
            var idx = ip.length;
            if (!last || idx !== last.end + 1) {
                zeroGroups.push({
                    start: idx,
                    end: idx
                });
            } else {
                last.end = idx;
                if (last.end - last.start > zeroGroups[zeroMaxGroup].end - zeroGroups[zeroMaxGroup].start) {
                    zeroMaxGroup = zeroGroups.length - 1;
                }
            }
        }
        ip.push(hex);
    }
    if (zeroGroups.length > 0) {
        var group = zeroGroups[zeroMaxGroup];
        if (group.end - group.start > 0) {
            ip.splice(group.start, group.end - group.start + 1, '');
            if (group.start === 0) {
                ip.unshift('');
            }
            if (group.end === 7) {
                ip.push('');
            }
        }
    }
    return ip.join(':');
};
util.estimateCores = function(options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = options || {};
    if ('cores' in util && !options.update) {
        return callback(null, util.cores);
    }
    if (typeof Worker === undefined) {
        util.cores = 1;
        return callback(null, util.cores);
    }
    if (typeof Blob === undefined) {
        util.cores = 2;
        return callback(null, util.cores);
    }
    var blobUrl = URL.createObjectURL(new Blob([
            '(',
            function() {
            self.addEventListener('message', function(e) {
                var st = Date.now();
                var et = st + 4;
                while (Date.now() < et);
                self.postMessage({
                    st: st,
                    et: et
                });
            });
            }.toString(),
            ')()'
        ], {
        type: 'application/javascript'
    }));
    sample([], 5, 16);

    function sample(max, samples, numWorkers) {
        if (samples === 0) {
            var avg = Math.floor(max.reduce(function(avg, x) {
                return avg + x;
            }, 0) / max.length);
            util.cores = Math.max(1, avg);
            URL.revokeObjectURL(blobUrl);
            return callback(null, util.cores);
        }
        map(numWorkers, function(err, results) {
            max.push(reduce(numWorkers, results));
            sample(max, samples - 1, numWorkers);
        });
    }

    function map(numWorkers, callback) {
        var workers = [];
        var results = [];
        for (var i = 0; i < numWorkers; ++i) {
            var worker = new Worker(blobUrl);
            worker.addEventListener('message', function(e) {
                results.push(e.data);
                if (results.length === numWorkers) {
                    for (var i = 0; i < numWorkers; ++i) {
                        workers[i].terminate();
                    }
                    callback(null, results);
                }
            });
            workers.push(worker);
        }
        for (var i = 0; i < numWorkers; ++i) {
            workers[i].postMessage(i);
        }
    }

    function reduce(numWorkers, results) {
        var overlaps = [];
        for (var n = 0; n < numWorkers; ++n) {
            var r1 = results[n];
            var overlap = overlaps[n] = [];
            for (var i = 0; i < numWorkers; ++i) {
                if (n === i) {
                    continue;
                }
                var r2 = results[i];
                if (r1.st > r2.st && r1.st < r2.et || r2.st > r1.st && r2.st < r1.et) {
                    overlap.push(i);
                }
            }
        }
        return overlaps.reduce(function(max, overlap) {
            return Math.max(max, overlap.length);
        }, 0);
    }
};

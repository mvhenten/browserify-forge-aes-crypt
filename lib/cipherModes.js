var cipher = require('./cipher') || {};
var modes = cipher.modes = require('./cipher').modes || {};
modes.ecb = function(options) {
    options = options || {};
    this.name = 'ECB';
    this.cipher = options.cipher;
    this.blockSize = options.blockSize || 16;
    this._blocks = this.blockSize / 4;
    this._inBlock = new Array(this._blocks);
    this._outBlock = new Array(this._blocks);
};
modes.ecb.prototype.start = function(options) {};
modes.ecb.prototype.encrypt = function(input, output) {
    for (var i = 0; i < this._blocks; ++i) {
        this._inBlock[i] = input.getInt32();
    }
    this.cipher.encrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(this._outBlock[i]);
    }
};
modes.ecb.prototype.decrypt = function(input, output) {
    for (var i = 0; i < this._blocks; ++i) {
        this._inBlock[i] = input.getInt32();
    }
    this.cipher.decrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(this._outBlock[i]);
    }
};
modes.ecb.prototype.pad = function(input, options) {
    var padding = input.length() === this.blockSize ? this.blockSize : this.blockSize - input.length();
    input.fillWithByte(padding, padding);
    return true;
};
modes.ecb.prototype.unpad = function(output, options) {
    if (options.overflow > 0) {
        return false;
    }
    var len = output.length();
    var count = output.at(len - 1);
    if (count > this.blockSize << 2) {
        return false;
    }
    output.truncate(count);
    return true;
};
modes.cbc = function(options) {
    options = options || {};
    this.name = 'CBC';
    this.cipher = options.cipher;
    this.blockSize = options.blockSize || 16;
    this._blocks = this.blockSize / 4;
    this._inBlock = new Array(this._blocks);
    this._outBlock = new Array(this._blocks);
};
modes.cbc.prototype.start = function(options) {
    if (options.iv === null) {
        if (!this._prev) {
            throw new Error('Invalid IV parameter.');
        }
        this._iv = this._prev.slice(0);
    } else if (!('iv' in options)) {
        throw new Error('Invalid IV parameter.');
    } else {
        this._iv = transformIV(options.iv);
        this._prev = this._iv.slice(0);
    }
};
modes.cbc.prototype.encrypt = function(input, output) {
    for (var i = 0; i < this._blocks; ++i) {
        this._inBlock[i] = this._prev[i] ^ input.getInt32();
    }
    this.cipher.encrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(this._outBlock[i]);
    }
    this._prev = this._outBlock;
};
modes.cbc.prototype.decrypt = function(input, output) {
    for (var i = 0; i < this._blocks; ++i) {
        this._inBlock[i] = input.getInt32();
    }
    this.cipher.decrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(this._prev[i] ^ this._outBlock[i]);
    }
    this._prev = this._inBlock.slice(0);
};
modes.cbc.prototype.pad = function(input, options) {
    var padding = input.length() === this.blockSize ? this.blockSize : this.blockSize - input.length();
    input.fillWithByte(padding, padding);
    return true;
};
modes.cbc.prototype.unpad = function(output, options) {
    if (options.overflow > 0) {
        return false;
    }
    var len = output.length();
    var count = output.at(len - 1);
    if (count > this.blockSize << 2) {
        return false;
    }
    output.truncate(count);
    return true;
};
modes.cfb = function(options) {
    options = options || {};
    this.name = 'CFB';
    this.cipher = options.cipher;
    this.blockSize = options.blockSize || 16;
    this._blocks = this.blockSize / 4;
    this._inBlock = null;
    this._outBlock = new Array(this._blocks);
};
modes.cfb.prototype.start = function(options) {
    if (!('iv' in options)) {
        throw new Error('Invalid IV parameter.');
    }
    this._iv = transformIV(options.iv);
    this._inBlock = this._iv.slice(0);
};
modes.cfb.prototype.encrypt = function(input, output) {
    this.cipher.encrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        this._inBlock[i] = input.getInt32() ^ this._outBlock[i];
        output.putInt32(this._inBlock[i]);
    }
};
modes.cfb.prototype.decrypt = function(input, output) {
    this.cipher.encrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        this._inBlock[i] = input.getInt32();
        output.putInt32(this._inBlock[i] ^ this._outBlock[i]);
    }
};
modes.cfb.prototype.afterFinish = function(output, options) {
    if (options.overflow > 0) {
        output.truncate(this.blockSize - options.overflow);
    }
    return true;
};
modes.ofb = function(options) {
    options = options || {};
    this.name = 'OFB';
    this.cipher = options.cipher;
    this.blockSize = options.blockSize || 16;
    this._blocks = this.blockSize / 4;
    this._inBlock = null;
    this._outBlock = new Array(this._blocks);
};
modes.ofb.prototype.start = function(options) {
    if (!('iv' in options)) {
        throw new Error('Invalid IV parameter.');
    }
    this._iv = transformIV(options.iv);
    this._inBlock = this._iv.slice(0);
};
modes.ofb.prototype.encrypt = function(input, output) {
    this.cipher.encrypt(this._inBlock, this._outBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(input.getInt32() ^ this._outBlock[i]);
        this._inBlock[i] = this._outBlock[i];
    }
};
modes.ofb.prototype.decrypt = modes.ofb.prototype.encrypt;
modes.ofb.prototype.afterFinish = function(output, options) {
    if (options.overflow > 0) {
        output.truncate(this.blockSize - options.overflow);
    }
    return true;
};
modes.ctr = function(options) {
    options = options || {};
    this.name = 'CTR';
    this.cipher = options.cipher;
    this.blockSize = options.blockSize || 16;
    this._blocks = this.blockSize / 4;
    this._inBlock = null;
    this._outBlock = new Array(this._blocks);
};
modes.ctr.prototype.start = function(options) {
    if (!('iv' in options)) {
        throw new Error('Invalid IV parameter.');
    }
    this._iv = transformIV(options.iv);
    this._inBlock = this._iv.slice(0);
};
modes.ctr.prototype.encrypt = function(input, output) {
    this.cipher.encrypt(this._inBlock, this._outBlock);
    inc32(this._inBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(input.getInt32() ^ this._outBlock[i]);
    }
};
modes.ctr.prototype.decrypt = modes.ctr.prototype.encrypt;
modes.ctr.prototype.afterFinish = function(output, options) {
    if (options.overflow > 0) {
        output.truncate(this.blockSize - options.overflow);
    }
    return true;
};
modes.gcm = function(options) {
    options = options || {};
    this.name = 'GCM';
    this.cipher = options.cipher;
    this.blockSize = options.blockSize || 16;
    this._blocks = this.blockSize / 4;
    this._inBlock = new Array(this._blocks);
    this._outBlock = new Array(this._blocks);
    this._R = 3774873600;
};
modes.gcm.prototype.start = function(options) {
    if (!('iv' in options)) {
        throw new Error('Invalid IV parameter.');
    }
    var iv = require('./util').createBuffer(options.iv);
    this._cipherLength = 0;
    var additionalData;
    if ('additionalData' in options) {
        additionalData = require('./util').createBuffer(options.additionalData);
    } else {
        additionalData = require('./util').createBuffer();
    }
    if ('tagLength' in options) {
        this._tagLength = options.tagLength;
    } else {
        this._tagLength = 128;
    }
    this._tag = require('./util').createBuffer(options.tag).getBytes();
    this._hashBlock = new Array(this._blocks);
    this.tag = null;
    this._hashSubkey = new Array(this._blocks);
    this.cipher.encrypt([
        0,
        0,
        0,
        0
    ], this._hashSubkey);
    this.componentBits = 4;
    this._m = this.generateHashTable(this._hashSubkey, this.componentBits);
    var ivLength = iv.length();
    if (ivLength === 12) {
        this._j0 = [
            iv.getInt32(),
            iv.getInt32(),
            iv.getInt32(),
            1
        ];
    } else {
        this._j0 = [
            0,
            0,
            0,
            0
        ];
        while (iv.length() > 0) {
            this._j0 = this.ghash(this._hashSubkey, this._j0, [
                iv.getInt32(),
                iv.getInt32(),
                iv.getInt32(),
                iv.getInt32()
            ]);
        }
        this._j0 = this.ghash(this._hashSubkey, this._j0, [
            0,
            0
        ].concat(from64To32(ivLength * 8)));
    }
    this._inBlock = this._j0.slice(0);
    inc32(this._inBlock);
    additionalData = require('./util').createBuffer(additionalData);
    this._aDataLength = from64To32(additionalData.length() * 8);
    var overflow = additionalData.length() % this.blockSize;
    if (overflow) {
        additionalData.fillWithByte(0, this.blockSize - overflow);
    }
    this._s = [
        0,
        0,
        0,
        0
    ];
    while (additionalData.length() > 0) {
        this._s = this.ghash(this._hashSubkey, this._s, [
            additionalData.getInt32(),
            additionalData.getInt32(),
            additionalData.getInt32(),
            additionalData.getInt32()
        ]);
    }
};
modes.gcm.prototype.encrypt = function(input, output) {
    this.cipher.encrypt(this._inBlock, this._outBlock);
    inc32(this._inBlock);
    var inputLength = input.length();
    for (var i = 0; i < this._blocks; ++i) {
        this._outBlock[i] ^= input.getInt32();
    }
    if (inputLength < this.blockSize) {
        var overflow = inputLength % this.blockSize;
        this._cipherLength += overflow;
        var tmp = require('./util').createBuffer();
        tmp.putInt32(this._outBlock[0]);
        tmp.putInt32(this._outBlock[1]);
        tmp.putInt32(this._outBlock[2]);
        tmp.putInt32(this._outBlock[3]);
        tmp.truncate(this.blockSize - overflow);
        this._outBlock[0] = tmp.getInt32();
        this._outBlock[1] = tmp.getInt32();
        this._outBlock[2] = tmp.getInt32();
        this._outBlock[3] = tmp.getInt32();
    } else {
        this._cipherLength += this.blockSize;
    }
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(this._outBlock[i]);
    }
    this._s = this.ghash(this._hashSubkey, this._s, this._outBlock);
};
modes.gcm.prototype.decrypt = function(input, output) {
    this.cipher.encrypt(this._inBlock, this._outBlock);
    inc32(this._inBlock);
    var inputLength = input.length();
    this._hashBlock[0] = input.getInt32();
    this._hashBlock[1] = input.getInt32();
    this._hashBlock[2] = input.getInt32();
    this._hashBlock[3] = input.getInt32();
    this._s = this.ghash(this._hashSubkey, this._s, this._hashBlock);
    for (var i = 0; i < this._blocks; ++i) {
        output.putInt32(this._outBlock[i] ^ this._hashBlock[i]);
    }
    if (inputLength < this.blockSize) {
        this._cipherLength += inputLength % this.blockSize;
    } else {
        this._cipherLength += this.blockSize;
    }
};
modes.gcm.prototype.afterFinish = function(output, options) {
    var rval = true;
    if (options.overflow) {
        output.truncate(this.blockSize - options.overflow);
    }
    this.tag = require('./util').createBuffer();
    var lengths = this._aDataLength.concat(from64To32(this._cipherLength * 8));
    this._s = this.ghash(this._hashSubkey, this._s, lengths);
    var tag = [];
    this.cipher.encrypt(this._j0, tag);
    for (var i = 0; i < this._blocks; ++i) {
        this.tag.putInt32(this._s[i] ^ tag[i]);
    }
    this.tag.truncate(this.tag.length() % (this._tagLength / 8));
    if (this._tag && this.tag.bytes() !== this._tag) {
        rval = false;
    }
    return rval;
};
modes.gcm.prototype.multiply = function(x, y) {
    var z_i = [
            0,
            0,
            0,
            0
        ];
    var v_i = y.slice(0);
    for (var i = 0; i < 128; ++i) {
        var x_i = x[i / 32 | 0] & 1 << 31 - i % 32;
        if (x_i) {
            z_i[0] ^= v_i[0];
            z_i[1] ^= v_i[1];
            z_i[2] ^= v_i[2];
            z_i[3] ^= v_i[3];
        }
        this.pow(v_i, v_i);
    }
    return z_i;
};
modes.gcm.prototype.pow = function(x, out) {
    var lsb = x[3] & 1;
    for (var i = 3; i > 0; --i) {
        out[i] = x[i] >>> 1 | (x[i - 1] & 1) << 31;
    }
    out[0] = x[0] >>> 1;
    if (lsb) {
        out[0] ^= this._R;
    }
};
modes.gcm.prototype.tableMultiply = function(x) {
    var z = [
            0,
            0,
            0,
            0
        ];
    for (var i = 0; i < 32; ++i) {
        var idx = i / 8 | 0;
        var x_i = x[idx] >>> (7 - i % 8) * 4 & 15;
        var ah = this._m[i][x_i];
        z[0] ^= ah[0];
        z[1] ^= ah[1];
        z[2] ^= ah[2];
        z[3] ^= ah[3];
    }
    return z;
};
modes.gcm.prototype.ghash = function(h, y, x) {
    y[0] ^= x[0];
    y[1] ^= x[1];
    y[2] ^= x[2];
    y[3] ^= x[3];
    return this.tableMultiply(y);
};
modes.gcm.prototype.generateHashTable = function(h, bits) {
    var multiplier = 8 / bits;
    var perInt = 4 * multiplier;
    var size = 16 * multiplier;
    var m = new Array(size);
    for (var i = 0; i < size; ++i) {
        var tmp = [
                0,
                0,
                0,
                0
            ];
        var idx = i / perInt | 0;
        var shft = (perInt - 1 - i % perInt) * bits;
        tmp[idx] = 1 << bits - 1 << shft;
        m[i] = this.generateSubHashTable(this.multiply(tmp, h), bits);
    }
    return m;
};
modes.gcm.prototype.generateSubHashTable = function(mid, bits) {
    var size = 1 << bits;
    var half = size >>> 1;
    var m = new Array(size);
    m[half] = mid.slice(0);
    var i = half >>> 1;
    while (i > 0) {
        this.pow(m[2 * i], m[i] = []);
        i >>= 1;
    }
    i = 2;
    while (i < half) {
        for (var j = 1; j < i; ++j) {
            var m_i = m[i];
            var m_j = m[j];
            m[i + j] = [
                m_i[0] ^ m_j[0],
                m_i[1] ^ m_j[1],
                m_i[2] ^ m_j[2],
                m_i[3] ^ m_j[3]
            ];
        }
        i *= 2;
    }
    m[0] = [
        0,
        0,
        0,
        0
    ];
    for (i = half + 1; i < size; ++i) {
        var c = m[i ^ half];
        m[i] = [
            mid[0] ^ c[0],
            mid[1] ^ c[1],
            mid[2] ^ c[2],
            mid[3] ^ c[3]
        ];
    }
    return m;
};

function transformIV(iv) {
    if (typeof iv === 'string') {
        iv = require('./util').createBuffer(iv);
    }
    if (require('./util').isArray(iv) && iv.length > 4) {
        var tmp = iv;
        iv = require('./util').createBuffer();
        for (var i = 0; i < iv.length; ++i) {
            iv.putByte(tmp[i]);
        }
    }
    if (!require('./util').isArray(iv)) {
        iv = [
            iv.getInt32(),
            iv.getInt32(),
            iv.getInt32(),
            iv.getInt32()
        ];
    }
    return iv;
}

function inc32(block) {
    block[block.length - 1] = block[block.length - 1] + 1 & 4294967295;
}

function from64To32(num) {
    return [
        num / 4294967296 | 0,
        num & 4294967295
    ];
}
module.exports = modes;

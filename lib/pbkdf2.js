var pkcs5 = {};
module.exports = pkcs5.pbkdf2 = function(p, s, c, dkLen, md) {
    if (typeof md === 'undefined' || md === null) {
        md = require('./md').sha1.create();
    }
    var hLen = md.digestLength;
    if (dkLen > 4294967295 * hLen) {
        throw new Error('Derived key is too long.');
    }
    var len = Math.ceil(dkLen / hLen);
    var r = dkLen - (len - 1) * hLen;
    var prf = require('./hmac').create();
    prf.start(md, p);
    var dk = '';
    var xor, u_c, u_c1;
    for (var i = 1; i <= len; ++i) {
        prf.start(null, null);
        prf.update(s);
        prf.update(require('./util').int32ToBytes(i));
        xor = u_c1 = prf.digest().getBytes();
        for (var j = 2; j <= c; ++j) {
            prf.start(null, null);
            prf.update(u_c1);
            u_c = prf.digest().getBytes();
            xor = require('./util').xorBytes(xor, u_c, hLen);
            u_c1 = u_c;
        }
        dk += i < len ? xor : xor.substr(0, r);
    }
    return dk;
};

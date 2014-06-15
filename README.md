browserify-forge-aes-crypt
==========================

AES components from forge stripped of AMD support and fixed for browserify

# WARNING

This module is a hack. I've tried to use node-forge with browserify but it did not work due
to the hardcoded AMD support.

This module rewrites parts of the sources from [forge](https://github.com/digitalbazaar/forge)
using [esprima](http://esprima.org/). Currently, only a subset is used, as this module is
aimed towards personal use.

**BIG FAT DISCLAIMER**

I know too little of crypto. I've applied a small number of fixes on top of the esprima code
changes. This may influence the strength of your crypto. I'm still learning and investigating.

This module is intended for a personal project that uses [browserify](http://browserify.org/) together with webworkers.
From reading the sources of the [random](./lib/random.js) module I understand that this messes
up random entropy generation.

## installing

    npm install browserify-forge-aes-crypt

## usage

Please look at [forge](https://github.com/digitalbazaar/forge) for any real pointers. This is
what I currently use. If something doesn't work it's propably my fault. Always use the official
distrobution as a reference.

```javascript
    var forge = require('browserify-forge-aes-crypt');

    var Demo = {
        encrypt: function(password, data) {
            var salt = forge.random.getBytesSync(128),
                iv = forge.random.getBytesSync(16),
                key = forge.pbkdf2(password, salt, 100, 16),
                cipher = forge.aes.createEncryptionCipher(key, 'CBC');

            cipher.start(iv);
            cipher.update(forge.util.createBuffer(data), 'utf8');
            cipher.finish();

            return {
                secret: cipher.output.toHex(),
                salt: forge.util.bytesToHex(salt),
                iv: forge.util.bytesToHex(iv)
            };
        },

        decrypt: function(password, secret, salt, iv) {
            var key = forge.pbkdf2(password, forge.util.hexToBytes(salt), 100, 16),
                encrypted = forge.util.createBuffer(forge.util.hexToBytes(secret)),
                cipher = forge.aes.createDecryptionCipher(key, 'CBC');

            cipher.start(forge.util.hexToBytes(iv));
            cipher.update(encrypted);
            cipher.finish();

            return cipher.output;
        },
    };
```

## building

How does this work? The `forge` repository is cloned, and a simple [script](./lib/import.js) is
used to rewrite sources from that repository into node modules that can be browserified.

The real magic is using `esprima`, I rewrite the bits that I understand and apply a small number
of fixes afterwards.

see:

    ./import.sh

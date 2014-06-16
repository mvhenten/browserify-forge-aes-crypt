'use strict';

var fs = require('fs'),
    esp = require('esprima'),
    path = require('path'),
    _ = require('lodash'),
    escodegen = require('escodegen');

var SOURCE = process.argv[2],
    TARGET = process.argv[3];

var MODULE_NAME = path.basename(TARGET).replace(path.extname(TARGET), '');

var src = fs.readFileSync(SOURCE);

// hacky fix: remove references to forge.disableNativeCode
src = src.toString().replace(/[!]?forge.disableNativeCode\s(&&|\|\|)/, '');

// another pre-processing hack
if (MODULE_NAME == 'pbkdf2') {
    src = src.replace('var pkcs5 = forge.pkcs5 = forge.pkcs5 || {};', 'var pkcs5 = {}');
}

var obj = esp.parse(src);

function mkRequire(name) {
    return {
        type: 'CallExpression',
        callee: {
            type: 'Identifier',
            name: 'require'
        },
        arguments: [{
            type: 'Literal',
            value: './' + name,
            raw: '\'./' + name + '\''
        }]
    };
}

function mkVar(obj, name, right) {
    obj.type = 'VariableDeclaration';
    obj.kind = 'var';
    obj.declarations = [{
        type: 'VariableDeclarator',
        id: {
            type: 'Identifier',
            name: name
        },
        init: right
    }];
}

function mkModuleExports(value) {
    value.object.name = 'module';
    value.property.name = 'exports';
}

function transform(obj, moduleName) {
    _.each(obj, function(value, key) {
        if (typeof value !== 'object' || !value) return;

        /**
         * 1. First check assignment expressions.
         *
         * 1.1 if the left side is something like "forge.{something}"
         * this becomes var {something} = right side
         *
         * 1.2 if the left side is something like "forge.{first}.{second}"
         * this becomes something like {first}.{second} = right side
         * additionally, any {first} that matches the moduleName becomes simply module.exports
         *
         */
        if (value.type == 'AssignmentExpression') {

            if (value.left.type == 'MemberExpression' && value.left.object.name == 'forge') {
                if (value.left.property.name !== moduleName) {
                    mkVar(obj, value.left.property.name, value.right);
                    transform(value.right, moduleName);
                    return;
                }
            }

            if (value.left.type == 'MemberExpression' && value.left.object.object && value.left.object.object.name == 'forge') {
                var name = value.left.object.property.name;

                value.left.object = {
                    type: 'Identifier',
                    name: name == moduleName ? 'module.exports' : name
                };

                transform(value, moduleName);
                return;
            }
        }

        /**
         * 2. This is not an assignment, if it's not an MemberExpression of forge.{something},
         *
         * simply walk it's elements and return.
         */
        if (value.type !== 'MemberExpression' || (value.object && value.object.name !== 'forge'))
            return transform(value, moduleName);

        /**
         * 3. This must be a MemberExpression. Check if we're trying to get an object property
         *
         * This catches everythign that looks like forge.{something} and converts this
         * into a require({something}), or module.exports if it's forge.{moduleName}
         */
        if (value.property.type === 'Identifier') {
            if (key == 'left' || key == 'object') {
                if (value.property.name == moduleName)
                    return mkModuleExports(value);
            }

            obj[key] = mkRequire(value.property.name);
        }
    });
}

function search(query, obj, found) {
    _.each(obj, function(value) {
        if (typeof value !== 'object' || !value) return;

        if (value.type === query.type && value.id && value.id.name === query.name) {
            return found(value);
        }

        search(query, value, found);
    });
}

var query = {
    type: 'FunctionDeclaration',
    name: 'initModule'
};

/**
 * First, find the function initModule. We'll only use the body of this function.
 */
search(query, obj, function(result) {
    var body = result.body,
        code;

    // set the body type to program
    // so esprima considers this a top-level
    // code block
    body.type = 'Program';

    // transform changes the AST IN PLACE
    transform(body, MODULE_NAME);

    code = escodegen.generate(body);

    /**
     * cipher.modes is missing due a missing module.export in cipherModes
     * and a missing export in cipher
     */
    if (MODULE_NAME === 'cipher') {
        code = code + '\nmodule.exports.modes = require(\'./cipherModes\')';
    }
    if (MODULE_NAME === 'cipherModes') {
        code = code + '\nmodule.exports = modes;';
    }

    fs.writeFileSync(TARGET, code);
});

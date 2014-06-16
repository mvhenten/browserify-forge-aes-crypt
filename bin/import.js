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
var obj = esp.parse(src.toString());

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

                transform(value.right, moduleName);
                return;
            }
        }

        if (value.type !== 'MemberExpression' || (value.object && value.object.name !== 'forge'))
            return transform(value, moduleName);

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

search(query, obj, function(result) {
    var body = result.body;
    body.type = 'Program';

    transform(body, MODULE_NAME);

    fs.writeFileSync(TARGET, escodegen.generate(body));
});

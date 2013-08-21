var mathjs = require('mathjs');
var _ = require('underscore');
var parser = new mathjs.expr.Parser();
//var node = parser.parse('a+b/x+cos(3*x)');
var node = parser.parse('sin(x)/x');
// http://en.wikipedia.org/wiki/Differentiation_rules#The_chain_rule
//console.log(JSON.stringify(node, null, 4));
console.log(node);

function derive (node) {
    function deriveExpr (node) {
        if (node.expr) {
            node.expr = deriveExpr(node.expr);
            return node;
        }
        if (node.value) {
            return 0;
        }
        if (node.fn) {
            var fnName = node.fn.toString().match(/^function (\w+)\s*\(/)[1];
            switch (fnName) {
                case 'add': break;
                case 'subtract': break;
                case 'multiply':
                    var a = _.extend({}, node.params[0]),
                        b = _.extend({}, node.params[1]),
                        Da = deriveExpr(_.extend({}, a)),
                        Db = deriveExpr(_.extend({}, b));
                    return new mathjs.expr.node.OperatorNode('+', mathjs.add, [
                        new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [ Da, b ]),
                        new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [ a, Db ]),
                    ]);
                case 'divide':
                    var a = _.extend({}, node.params[0]),
                        b = _.extend({}, node.params[1]),
                        Da = deriveExpr(_.extend({}, a)),
                        Db = deriveExpr(_.extend({}, b)),
                        const2 = new mathjs.expr.node.ConstantNode(2);
                    return new mathjs.expr.node.OperatorNode('/', mathjs.divide, [
                        new mathjs.expr.node.OperatorNode('-', mathjs.subtract, [
                            new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [ Da, b ]),
                            new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [ a, Db ]),
                        ]),
                        new mathjs.expr.node.OperatorNode('^', mathjs.pow, [ b, const2 ])
                    ]);
                case 'pow':
                    if (node.params[1].value) {
                        var a = _.extend({}, node.params[0]),
                            b = _.extend({}, node.params[1]),
                            exp = new mathjs.expr.node.ConstantNode(b.eval()-1);
                        return new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [
                            b,
                            new mathjs.expr.node.OperatorNode('^', mathjs.pow, [ a, exp ])
                        ]);
                    } else {
                        // TODO  (@see u^v)
                    }
                case 'log':
                default:
                    console.log('unhandled expression:', fnName);
                    console.log(node)
            }
        }
        if (node.object) {
            switch (node.object.name) {
                case 'log':
                    var u = node.params[0];
                    if (u.object || u.fn) {
                        return new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [
                            new mathjs.expr.node.OperatorNode('/', mathjs.divide, [
                                1, u
                            ]),
                            deriveExpr(_.extend({}, u))
                        ]);
                    } else {
                        return new mathjs.expr.node.OperatorNode('/', mathjs.divide, [
                            1, u
                        ]);
                    }
                case 'sin':
                    var n = _.extend({}, node),
                        o = _.extend({}, node.object),
                        param = _.extend({}, node.params[0]);
                    o.name = 'cos';
                    n.object = o;
                    return new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [
                        n, deriveExpr(param)
                    ]);
                case 'cos':
                    var n = _.extend({}, node),
                        o = _.extend({}, node.object),
                        param = _.extend({}, node.params[0]);
                    o.name = 'sin';
                    n.object = o;
                    return new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [
                        -1,
                        new mathjs.expr.node.OperatorNode('*', mathjs.multiply, [
                            n, deriveExpr(param)
                        ])
                    ]);
            }
        }

        if (!node.params) {
            // TODO this is temporal for human readable expr
            if (!~['x', 'y', 'z'].indexOf(node.name)) {
                node.name = 'D' + node.name;
            } else {
                node = new mathjs.expr.node.ConstantNode(1);
            }
            return node;
        }

        var i, children = node.params;
        for (i = children.length-1; i >= 0; i--) {
            node.params[i] = deriveExpr(children[i]);
        }
        return node;
    }
    return deriveExpr(node);
}

console.log(node.toString());
node = derive(node);
console.log(node.toString());

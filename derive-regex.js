var mathjs = require('mathjs');
var _ = require('underscore');
var parser = new mathjs.expr.Parser();
var node = parser.parse('cos(x*y)');
//var node = parser.parse('sin(x)/x');
// http://en.wikipedia.org/wiki/Differentiation_rules#The_chain_rule
//console.log(JSON.stringify(node, null, 4));
console.log(node);


function derive (node) {
    var deriveMap = {
        'a+b': 'a+b',
        'a-b': 'a-b',
        'a*b': 'Da*b + a*Db',
        'a/b': '(Da*b - a*Db)/b^2',
        'a^b': 'b*a^(b-1)',
        'cos(a)': '-sin(a)*Da',
        'sin(a)': 'cos(a)*Da',
        'log(a)': '(1/a)*Da',
    };
    function deriveExpr (node) {
        if (node.expr) {
            node.expr = deriveExpr(node.expr);
            return node;
        }
        if (node.value) {
            return 0;
        }
        if (node.object||node.fn) {
            var mockNode = _.extend({}, node),
                i, l = (mockNode.params||[]).length, tmpNode,
                wildcards = 'abcdefghijklmnopqrstuvwxyz'.split(''),
                replacements = {};
            for (i = 0; i < l; i++) {
                symbol = wildcards[i];
                tmpNode = node.params[i];
                mockNode.params[i] = '_' + symbol + '_';
                replacements[symbol] = tmpNode;
            }
            var mockedFormula = mockNode.toString().replace(/[\s_]+/g,'');
            var derivedFormula = deriveMap[mockedFormula] || '';
            var derivedNode = parser.parse(derivedFormula);
console.log('derivedF:', derivedFormula);

            for (i = 0; i < l; i++) {
                symbol = wildcards[i];
                tmpNode = derivedNode.expr.find({ properties: { name: symbol } })[0];
                var k;
console.log('tmpNode:', tmpNode);
                for (k in tmpNode) {
                    if (tmpNode.hasOwnProperty(k)) delete tmpNode[k];
                }
                for (k in replacements[symbol]) {
                    if (replacements[symbol].hasOwnProperty(k))
                        tmpNode[k] = replacements[symbol][k];
                }
                tmpNode[k] = deriveExpr(tmpNode[k]);
console.log('tmpNode:', tmpNode);
            }
console.log('derivedN:', derivedNode);
console.log('derivedF:', derivedFormula);
            node = derivedNode;
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

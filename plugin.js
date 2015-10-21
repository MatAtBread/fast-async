"use strict";

/*
 * 'fast-async' plugin for Babel. It uses nodent to transform the entire program before passing it off
 * to the next transformer.
 */
module.exports = function (babel) {
	var logger = console.log.bind(console) ;
	var nodent = require('nodent')({log:logger}) ;
	var opts = nodent.parseCompilerOptions('"use nodent-promises";',nodent.log) ;
	var binder = nodent.parse("Function.prototype.$asyncbind="+Function.prototype.$asyncbind.toString().replace(/[\s]+/g," "),null,opts);
	var asyncbind = binder.ast.body[0];	

	return new babel.Plugin("fast-async", {
		visitor: {
			Program:function Program(node,parent) {
				var pr = { origCode:null, filename:null, ast:node } ;
				nodent.asynchronize(pr,undefined,opts,nodent.log) ;
				pr.ast.body.unshift(asyncbind) ;
				return pr.ast ;
			}
		}
	});
};

//module.exports = exports["default"];


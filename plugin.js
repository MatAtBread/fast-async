"use strict";

/*
 * 'fast-async' plugin for Babel v6.x. It uses nodent to transform the entire program before passing it off
 * to the next transformer.
 */

var parserExtensionName = 'asyncFunctions';
/* This is a VERY, VERY BAD piece of code - import the babylon parser and register the acorn-es7-plugin with it *
debugger ;
try {
	var babylonParser = require.cache[Object.keys(require.cache).filter(function(x){ return x.match('babylon/lib/parser/index.js') })[0]] ;
	var fauxAcorn = {plugins:{}} ;
	require("acorn-es7-plugin")(fauxAcorn) ;
	babylonParser.exports.plugins['fast-async'] = function(parser) {
		return fauxAcorn.plugins.asyncawait(parser,{asyncExits:true,awaitAnywhere:true}) ;
	}
	parserExtensionName = 'fast-async'
} catch (ex) {
	// This is going to fail
	debugger ;
}*/


module.exports = function (types) {
	debugger ;
	var logger = console.log.bind(console) ;
	var nodent = require('nodent') ;

	return {
		// Lifted from https://github.com/babel/babel/blob/master/packages/babel-plugin-syntax-async-functions/src/index.js#L3,
		// which is not nice, but avoids installation complexity with plugins (which I must try to work out sometime)
		manipulateOptions: function manipulateOptions(opts, parserOpts) {
			parserOpts.plugins.push(parserExtensionName);
		},
		visitor: {
			Program:function Program(path,state) {
				var envOpts = state.opts.env || {} ;
				if (!('log' in envOpts)) envOpts.log = logger ;
				if (!('dontInstallRequireHook' in envOpts)) envOpts.dontInstallRequireHook = true ;
				var compiler = nodent(envOpts) ;

				var opts = compiler.parseCompilerOptions('"use nodent-promises";',compiler.log) ;
				opts.babelTree = true ;

				for (var k in opts) {
					if (state.opts && state.opts.compiler && (k in state.opts.compiler))
						opts[k] = state.opts.compiler[k] ;
				}
				var pr = { origCode:state.file.code, filename:"", ast:path.node } ;

				var binder = compiler.parse("Function.prototype.$asyncbind="+Function.prototype.$asyncbind.toString().replace(/[\s]+/g," "),null,opts);
				var asyncbind = binder.ast.body[0];
				compiler.asynchronize(pr,undefined,opts,compiler.log) ;
				pr.ast.body.unshift(asyncbind) ;
			}
		}
	};
};

"use strict";

/*
 * 'fast-async' plugin for Babel v6.x. It uses nodent to transform the entire program before passing it off
 * to the next transformer.
 */

var parserExtensionName = 'asyncFunctions';

module.exports = function (types) {
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
				compiler.asynchronize(pr,undefined,opts,compiler.log) ;

				function getRuntime(symbol,fn) {
				    var runtime = symbol+"="+fn.toString().replace(/[\s]+/g," ")+";\n" ;
                    opts.parser.ranges = false ;
                    opts.parser.locations = false ;
				    var ast = compiler.parse(runtime,null,opts).ast.body[0] ;
				    // Remove location information from the runtime as Babel >=6.5.0 does a search by 
				    // location and barfs if multiple nodes appearantly occupy the same source locations
				    ast = JSON.parse(JSON.stringify(ast,function replacer(key, value) {
				        if (key==="start" || key==="end")
				            return undefined;
				          return value;
				        })) ;
				    
					return ast ;
				}

				if (!state.opts.runtimePattern) {
	                pr.ast.body.unshift(getRuntime('Function.prototype.$asyncbind',Function.prototype.$asyncbind)) ;
				} else {
				    if (state.opts.runtimePattern==='directive') {
	                    if (path.node.directives) {
	                        for (var i=0; i<path.node.directives.length; i++) {
	                            if (path.node.directives[i].value.type==="DirectiveLiteral" && path.node.directives[i].value.value==="use runtime-nodent") {
	                                pr.ast.body.unshift(getRuntime('Function.prototype.$asyncbind',Function.prototype.$asyncbind)) ;
	                                path.node.directives.splice(i,1) ;
	                                break ;
	                            }
	                        }
	                    }
				    } else {
	                    var pattern = new RegExp(state.opts.runtimePattern) ;
	                    if (state.file.parserOpts.filename.match(pattern)) {
	                        pr.ast.body.unshift(getRuntime('Function.prototype.$asyncbind',Function.prototype.$asyncbind)) ;
	                    }
				    }
				}
			}
		}
	};
};

'use strict';

/*
 * 'fast-async' plugin for Babel v6.x. It uses nodent to transform the entire program before passing it off
 * to the next transformer.
 */
module.exports = function (babel) {
	var logger = console.log.bind(console);
	var nodent = require('nodent');
	var parserExtensionName = 'asyncFunctions';
	var shouldIncludeRuntime = false;

	function getRuntime(symbol, fn) {
		var runtime = symbol + '=' + fn.toString();
		return babel.transform(runtime).ast.program.body;
	}

	return {
		// Lifted from https://github.com/babel/babel/blob/master/packages/babel-plugin-syntax-async-functions/src/index.js#L3,
		// which is not nice, but avoids installation complexity with plugins (which I must try to work out sometime)
		manipulateOptions: function manipulateOptions(opts, parserOpts) {
			parserOpts.plugins.push(parserExtensionName);
		},

		visitor: {
			Program: {
				enter: function (path, state) {
					var envOpts = state.opts.env || {};
					if (!('log' in envOpts)) envOpts.log = logger;
					if (!('dontInstallRequireHook' in envOpts)) envOpts.dontInstallRequireHook = true;

					var compiler = nodent(envOpts);

					var opts = compiler.parseCompilerOptions('"use nodent-promises";', compiler.log);
					opts.babelTree = true;

					for (var key in opts) {
						if (state.opts && state.opts.compiler && (key in state.opts.compiler))
							opts[key] = state.opts.compiler[key];
					}

					var pr = { origCode: state.file.code, filename: '', ast: path.node };
					compiler.asynchronize(pr, undefined, opts, compiler.log);
				},

				exit: function (path, state) {
					if (!shouldIncludeRuntime) {
						return;
					}

					var runtime = getRuntime('Function.prototype.$asyncbind', Function.prototype.$asyncbind);

					if (state.opts.useModule) {
						var moduleName = state.opts.useModule;
						// TODO Use default moduleName ('nodent-runtime') if opts.useModule is true, wait until this module actually exists
						// var moduleName = state.opts.useModule === true ? 'nodent-runtime' : state.opts.useModule;
						state.addImport(moduleName, 'default');
					}
					else if (!state.opts.runtimePattern) {
						path.unshiftContainer('body', runtime);
					}
					else if (state.opts.runtimePattern === 'directive') {
						var hasRuntime = false;
						for (var index = 0; index < path.node.directives.length; index++) {
							if (path.node.directives[index].value.value === 'use runtime-nodent') {
								if (!hasRuntime) {
									path.unshiftContainer('body', runtime);
									hasRuntime = true;
								}
								path.node.directives.splice(index, 1);
							}
						}
			    }
					else {
	          var pattern = new RegExp(state.opts.runtimePattern);
	          if (state.file.parserOpts.filename.match(pattern)) {
	            path.unshiftContainer('body', runtime);
	          }
			    }
				}
			},

			FunctionExpression: function FunctionExpression(path, state) {
        if (path.node.$wasAsync) {
					shouldIncludeRuntime = true
        }
      },
		}
	};
};

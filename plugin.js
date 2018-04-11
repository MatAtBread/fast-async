'use strict';

/*
 * 'fast-async' plugin for Babel v6.x. It uses nodent to transform the entire program before passing it off
 * to the next transformer.
 */
module.exports = function (babel) {
    var logger = console.log.bind(console);
    var NodentCompiler = require('nodent-compiler');
    var compiler = null;
    var compilerOpts = {};
    var requiresTranspilation = false;
    var defaultEnv = {
        log:logger
    };

    function getRuntime(symbol, fn, opts, compiler) {
        var runtime = symbol + '=' + fn.toString().replace(/[\s]+/g, ' ') + ';\n';
        opts.parser.ranges = false;
        opts.parser.locations = false;
        // Use babel rather than nodent (acorn) as babel's AST is not ESTree compliant
        var ast = babel.transform(runtime, { ast: true }).ast.program.body[0];
        // Remove location information from the runtime as Babel >=6.5.0 does a search by
        // location and barfs if multiple nodes apparently occupy the same source locations
        ast = JSON.parse(JSON.stringify(ast, function replacer(key, value) {
            return (key === 'start' || key === 'end' ? undefined : value);
        }));
        return ast;
    }

    return {
        // Lifted from https://github.com/babel/babel/blob/master/packages/babel-plugin-syntax-async-functions/src/index.js#L3,
        // which is not nice, but avoids installation complexity with plugins (which I must try to work out sometime)
        manipulateOptions: function manipulateOptions(opts, parserOpts) {
            parserOpts.plugins.push('asyncFunctions');
        },

        visitor: {
            Program: {
                enter: function(path, state){
                    requiresTranspilation = false;
                },
                exit: function (path, state) {
                    // Check if there was an async or await keyword before bothering to process the AST
                    if (!requiresTranspilation)
                        return ;

                    state.opts = state.opts || {} ;
                    var envOpts = state.opts.env || {};
                    Object.keys(defaultEnv).forEach(function(k){
                        if (!(k in envOpts))
                            envOpts[k] = defaultEnv[k] ;
                    }) ;

                    compiler = new NodentCompiler(envOpts);

                    /* Compiler options */
                    compilerOpts = {} ;
                    Object.keys(NodentCompiler.initialCodeGenOpts).forEach(function(k){
                        compilerOpts[k] = NodentCompiler.initialCodeGenOpts[k] ;
                    }) ;
                    compilerOpts.promises = true ;
                    compilerOpts.babelTree = true;
                    compilerOpts.parser = { noNodentExtensions: true} ;

                    var defCompilerOpts = state.opts.compiler || {} ;
                    if (state.opts.spec) {
                        defCompilerOpts.promises = true ;
                        defCompilerOpts.wrapAwait = true ;
                        defCompilerOpts.noRuntime = true ;
                    }

                    if (defCompilerOpts && typeof defCompilerOpts==="object") {
                        Object.keys(defCompilerOpts).forEach(function(k){
                            compilerOpts[k] = defCompilerOpts[k] ;
                        }) ;
                    }

                    var pr = { origCode: state.file.code, filename: '', ast: path.node };
                    compiler.asynchronize(pr, undefined, compilerOpts, compiler.log);

                    var runtime ;
                    if (!compilerOpts.noRuntime) {
                        if (compilerOpts.generators) {
                            runtime = getRuntime('Function.prototype.$asyncspawn', require('nodent-runtime').$asyncspawn, compilerOpts, compiler);
                        } else {
                            runtime = getRuntime('Function.prototype.$asyncbind', require('nodent-runtime').$asyncbind, compilerOpts, compiler);
                        }

                        if (state.opts.useRuntimeModule) {
                        	   state.addImport(state.opts.useRuntimeModule === true ? 'nodent-runtime' : state.opts.useRuntimeModule, 'default');
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
                            var parserOpts = state.file.parserOpts;

                            // The key is called sourceFileName since babel-core 6.16:
                            var sourceFileName = parserOpts.filename || parserOpts.sourceFileName;
                            if (sourceFileName.match(pattern)) {
                                path.unshiftContainer('body', runtime);
                            }
                        }
                    }
                }
            },

            AwaitExpression: function Function(path, state) {
                requiresTranspilation = true;
            },

            Function: function Function(path, state) {
                if (path.node.async) {
                    requiresTranspilation = true;
                }
            }
        }
    };
};

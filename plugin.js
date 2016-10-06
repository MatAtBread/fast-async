'use strict';

/*
 * 'fast-async' plugin for Babel v6.x. It uses nodent to transform the entire program before passing it off
 * to the next transformer.
 */
module.exports = function () {
  var logger = console.log.bind(console);
  var nodent = require('nodent');
  var parserExtensionName = 'asyncFunctions';
  var shouldIncludeRuntime = false;
  var compiler = null;
  var compilerOpts = {};

  function getRuntime(symbol, fn, opts, compiler) {
    var runtime = symbol + '=' + fn.toString().replace(/[\s]+/g, ' ') + ';\n';
    opts.parser.ranges = false;
    opts.parser.locations = false;
    var ast = compiler.parse(runtime, null, opts).ast.body[0];
    // Remove location information from the runtime as Babel >=6.5.0 does a search by
    // location and barfs if multiple nodes appearantly occupy the same source locations
    ast = JSON.parse(JSON.stringify(ast, function replacer(key, value) {
      return (key === 'start' || key === 'end' ? undefined : value);
    }));
    return ast;
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

          compiler = nodent(envOpts);
          compilerOpts = compiler.parseCompilerOptions('"use nodent-promises";', compiler.log);
          compilerOpts.babelTree = true;

          for (var key in compilerOpts) {
            if (state.opts && state.opts.compiler && (key in state.opts.compiler))
              compilerOpts[key] = state.opts.compiler[key];
          }

          var pr = { origCode: state.file.code, filename: '', ast: path.node };
          compiler.asynchronize(pr, undefined, compilerOpts, compiler.log);
        },

        exit: function (path, state) {
          var runtime = getRuntime('Function.prototype.$asyncbind', Function.prototype.$asyncbind, compilerOpts, compiler);

          if (state.opts.useModule && shouldIncludeRuntime) {
            var moduleName = state.opts.useModule;
            // TODO Use default moduleName ('runtime-nodent') if opts.useModule is true, wait until this module actually exists
            // var moduleName = state.opts.useModule === true ? 'runtime-nodent' : state.opts.useModule;
            state.addImport(moduleName, 'default');
          }
          else if (!state.opts.runtimePattern && shouldIncludeRuntime) {
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
          else if (shouldIncludeRuntime) {
            var pattern = new RegExp(state.opts.runtimePattern);
            if (state.file.parserOpts.filename.match(pattern)) {
              path.unshiftContainer('body', runtime);
            }
          }
        }
      },

      Function: function Function(path, state) {
        if (path.node.$wasAsync) {
          shouldIncludeRuntime = true;
        }
      },
    }
  };
};

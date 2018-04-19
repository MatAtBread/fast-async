/* Babel 7 transform */

var babylon = require("babylon");
var generate = require("@babel/generator").default;

function printNode(ast) {
  return generate(ast, {}).code;
}

function parse(code) {
  return babylon.parse(code, {
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowSuperOutsideMethod: true,
  }).program;
}

var transform = require("nodent-transform").transform;

function transformAsyncToPromises(api, options) {
  var requiresTranspilation;
  var runtime = options.runtime ? (typeof options.runtime==="string" ? options.runtime : "$nodent_runtime") : null;
  var opts = {
    // Code generation options
    es6target: false,
    babelTree: true,
    engine: false,
    generators: false,
    promises: true,
    lazyThenables: false,
    wrapAwait: true,
    noRuntime: !runtime,
    $runtime: runtime,
    generatedSymbolPrefix: "$",
    $return: "$return",
    $error: "$error",
    $arguments: "$args",
    $Promise: "Promise",
    $asyncspawn: "$asyncspawn",
    $asyncbind: "$asyncbind",
    $makeThenable: "$makeThenable",
  };

  if (options.codeGenerationOptions) {
    var keys = Object.keys(options.codeGenerationOptions);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] in opts) {
        opts[keys[i]] = options.codeGenerationOptions[keys[i]];
      }
    }
  }

  return {
    visitor: {
      Program: {
        enter: function() {
          requiresTranspilation = false;
        },
        exit: function(path, state) {
          // Check if there was an async or await keyword before bothering to process the AST
          if (!requiresTranspilation) return;

          var newAst = transform(
            {
              // Input: the ast and filename
              filename: state.filename,
              ast: path.node,
            },
            opts,
            {
              // Helpers for the transformer:
              parse: parse, // Parse a JS fragment into an AST
              printNode: printNode, // Print a node as JS source
              logger: false /* console.log.bind(console)*/, // Log a warning
            }
          ).ast;

          if (runtime) {
            newAst.body.splice(0, 0, {
              type: "ImportDeclaration",
              specifiers: [
                {
                  type: "ImportDefaultSpecifier",
                  local: {
                    type: "Identifier",
                    name: runtime,
                  },
                },
              ],
              importKind: "value",
              source: {
                type: "StringLiteral",
                value: "nodent-runtime/promise",
              },
            });
          }
        },
      },

      AwaitExpression: function Function() {
        requiresTranspilation = true;
      },

      Function: function Function(path) {
        if (path.node.async) {
          requiresTranspilation = true;
        }
      },
    },
  };
}

module.exports = transformAsyncToPromises;

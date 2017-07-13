fast-async
==========

'fast-async' is a _Babel v6.x.x_ plugin that implements the ES7 keywords `async` and `await` using syntax transformation
at compile-time, rather than generators.

The main reason for using 'fast-async' as opposed to Babel's default implementation of async/await is
performance (https://github.com/MatAtBread/nodent#performance) - it's 3-4 times faster in a browser/node, and
as much as 10 times faster on a mobile browsers, mainly due to avoiding generators (and therefore regenerator).

There's a simple test (that just makes sure the plugin works and generates code that runs). More complete
test coverage is included with nodent.

Because Babel parses the code, the ES7 extensions possible with nodent (`await` anywhere, `async return` and `async throw`) are not supported, however full implementation of `async function` containing `await` expressions is implemented.

For _Babel v5.x.x_ install fast-async@1.0.3

> v6.1.x
fast-async@>=6.1.0 can use nodent v2 or v3 (and acorn v3 or v4). Nodent v3 has the option of generating code with Promises which needs no runtime at all, at the cost of size and speed. v6.1.x can also reference the runtime via an import (useRuntimeModule option), rather than include the source inline.

Install
-------
```bash
npm install fast-async --save
```
  
Usage
-----

Just include the plugin to the babel options. Minimal `.babelrc` example:
```js
{
  "plugins": ["fast-async"]
}
```

That's all. Neither `babel-plugin-transform-runtime` nor `babel-polyfill` required. Your application, once compiled, will probably needs nodent's runtime = see [below](#runtimepattern).

With options:
```js
{
  "plugins": [
    ["fast-async", {
      "env": {
      	"log":false
      },
      "compiler": {
        "promises": true,
        "generators": false
      },
      "runtimePattern":null,
      "useRuntimeModule":false
    }]
  ]
}
```

The option `spec` sets the compiler up to produce the most spec-compatible output (at the expense of some performance) by using the `wrapAwait`, `noRuntime` and `promises` options. Since `noRuntime` is specified, no runtime options are required.

```js
{
  "plugins": [
    ["fast-async", {
      "spec":true
    }]
  ]
}
```


Test
----
From the installation directory (e.g. node_modules/fast-async):
```bash
npm test
```
Options
-------
The plugin accepts the following options object, which itself is optional, as are all members. These are based on the options in nodent,
but since much of the parsing is done by Babel some are unused.

```js
env:{
  log:function(string),        // Supplied routine to emit transformation warnings. Default: console.log
  augmentObject:false,         // Add the nodent utilities asyncify() and isThenable() to Object.prototype
  dontMapStackTraces:true,     // Don't install the stack trace hook that maps line numbers (default: true)
  dontInstallRequireHook:false // Don't transform all JS files as they are loaded into node (default: true)
},
compiler:{
  promises:true    // Use nodent's "Promises" mode. Set to false if your runtime environment does not support Promises (default: true)
},
runtimePattern:null,     // See below
useRuntimeModule:false  // See below
```
_NB_: As of v6.3.x, the `env` options `augmentObject`,`dontMapStackTraces` and `dontInstallRequireHook:false` are no longer impemented or required. These modified the execution environment of the compiler (as opposed to the runtime environment of the code generated) and consequently had no purpose.

For more information on the compiler options, see [ES7 and Promises](https://github.com/matatbread/nodent#es7-and-promises) in the nodent documentation.

> 6.1.x
The dontMapStackTraces now defaults to `true` as having both nodent and babel map stack traces doesn't work well

runtimePattern
--------------
By default, fast-async will put the nodent runtime into every file containing an `async` function or `await` expression. 
If your project is made up of more than one file, the constant redefinition of the runtime is a waste of time and space. You can 
specify that you want the runtime in particular file(s) by setting the 'runtimePattern' to a regular expression (in quotes). 
Only files that match the regular expression will have the runtime defined (which is global, so you only need it once). 

Note: At least one of the file(s) matching the "runtimePattern" must use either `await` or `async` as the runtime function (or `require('nodent-runtime')` if you set `"useRuntimeModule":true`) is only included for files that reference it.

For example:

```js
"babel": {
  "plugins": [
    "syntax-async-functions",
    ["fast-async",{
       "runtimePattern":"test-input\\.js"
    }]
  ]
}
```
Alternatively, if you set runtimePattern to `"directive"`, the statement `"use runtime-nodent";` will be replaced with the runtime during compilation.

> v6.1.x
If you specify the option `"useRuntimeModule":true`, the runtime is not included directly as source, but via an import of [nodent-runtime](https://github.com/MatAtBread/nodent-runtime), which is typically resolved to `require()` by babel. The nodent-runtime module must be added as a dependency in your target project. The runtime need only be included once in your entire project, and should precede any code that uses async or await.

Useful Links
------------

* [nodent](https://github.com/MatAtBread/nodent)
* [Babel plugins](http://babeljs.io/docs/advanced/plugins/)

Online performance checkers:

* [nodent](http://nodent.mailed.me.uk/#function%20pause%28%29%20{%0A%20%20%20%20return%20new%20Promise%28function%20%28%24return%2C%20%24error%29%20{%0A%20%20%20%20%20%20%20%20setTimeout%28function%20%28%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return%280%29%3B%0A%20%20%20%20%20%20%20%20}%2C%200%29%3B%0A%20%20%20%20}%29%3B%0A}%0A%0Aasync%20function%20doNothing%28%29%20{%0A%20%20%20%20return%3B%0A}%0A%0Aasync%20function%20test%28%29%20{%0A%20%20%20%20var%20t%20%3D%20Date.now%28%29%3B%0A%20%20%20%20for%20%28var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20for%20%28var%20i%20%3D%200%3B%20i%20%3C%201000%3B%20i%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing%28%29%3B%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20await%20pause%28%29%3B%0A%20%20%20%20}%0A%20%20%20%20return%20Date.now%28%29%20-%20t%3B%0A}%0A%0Atest%28%29.then%28alert%29%3B%0A) 632ms (and shave off another 100ms by selecting 'Pure ES5' mode)
* [babel](https://babeljs.io/repl/#?experimental=true&evaluate=true&loose=false&spec=false&code=function%20pause%28%29%20{%0A%20%20%20%20return%20new%20Promise%28function%20%28%24return%2C%20%24error%29%20{%0A%20%20%20%20%20%20%20%20setTimeout%28function%20%28%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return%280%29%3B%0A%20%20%20%20%20%20%20%20}%2C%200%29%3B%0A%20%20%20%20}%29%3B%0A}%0A%0Aasync%20function%20doNothing%28%29%20{%0A%20%20%20%20return%3B%0A}%0A%0Aasync%20function%20test%28%29%20{%0A%20%20%20%20var%20t%20%3D%20Date.now%28%29%3B%0A%20%20%20%20for%20%28var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20for%20%28var%20i%20%3D%200%3B%20i%20%3C%201000%3B%20i%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing%28%29%3B%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20await%20pause%28%29%3B%0A%20%20%20%20}%0A%20%20%20%20return%20Date.now%28%29%20-%20t%3B%0A}%0A%0Atest%28%29.then%28alert%2Calert%29%3B%0A) 1877ms - 3x slower
* [traceur](https://google.github.io/traceur-compiler/demo/repl.html#%2F%2F%20Options%3A%20--annotations%20--array-comprehension%20--async-functions%20--async-generators%20--exponentiation%20--export-from-extended%20--for-on%20--generator-comprehension%20--member-variables%20--proper-tail-calls%20--require%20--symbols%20--types%20%0Afunction%20pause%28%29%20{%0A%20%20%20%20return%20new%20Promise%28function%20%28%24return%2C%20%24error%29%20{%0A%20%20%20%20%20%20%20%20setTimeout%28function%20%28%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return%280%29%3B%0A%20%20%20%20%20%20%20%20}%2C%200%29%3B%0A%20%20%20%20}%29%3B%0A}%0A%0Aasync%20function%20doNothing%28%29%20{%0A%20%20%20%20return%3B%0A}%0A%0Aasync%20function%20test%28%29%20{%0A%20%20%20%20var%20t%20%3D%20Date.now%28%29%3B%0A%20%20%20%20for%20%28var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20for%20%28var%20i%20%3D%200%3B%20i%20%3C%201000%3B%20i%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing%28%29%3B%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20await%20pause%28%29%3B%0A%20%20%20%20}%0A%20%20%20%20return%20Date.now%28%29%20-%20t%3B%0A}%0A%0Atest%28%29.then%28alert%2Calert%29%3B%20%0A) 2488ms - 4x slower

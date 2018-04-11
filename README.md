fast-async
==========

'fast-async' is a _Babel_ plugin that implements the ES7 keywords `async` and `await` using syntax transformation
at compile-time, rather than generators.

For _Babel v6.x.x_ install **fast-async@6**
For _Babel v7.x.x_ install **fast-async@7**
NB: Babel 7 is in beta. The core nodent functionality is due to be included in Babel 7 release - see https://github.com/babel/babel/pull/7076

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

**N.B.:** Starting in Babel v7, you'll need to prefix plugin names that do not begin with the `babel-plugin-` prefix with a `module:` directive:

```js
{
  "plugins": ["module:fast-async"]
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

Promises polyfill
--------------
The purpose of `fast-async` is to transform the `async` and `await` into code which can be run in environments that don't support these keywords. With `promises: false` option, the transformed code will not reference the `Promise` global object for its internal logic, however if you use `Promise` in your code, it will be left as is. Therefore, you still need to install a _polyfill_ if you want to use this plugin to transpile code for environments without the `Promise` support.

For example, with `Webpack`, you can do it by using `webpack.ProvidePlugin`:

```js
// npm install zousan

const config = {
  // ...
  plugins: {
    new webpack.ProvidePlugin({
      Promise: 'zousan',
    }),
  },
}
```

Useful Links
------------

* [nodent](https://github.com/MatAtBread/nodent)
* [Babel plugins](http://babeljs.io/docs/advanced/plugins/)

Online performance checkers:

* [nodent](http://nodent.mailed.me.uk/#function%20pause()%20%7B%0A%20%20%20%20return%20new%20Promise(function%20(%24return%2C%20%24error)%20%7B%0A%20%20%20%20%20%20%20%20setTimeout(function%20()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return(0)%3B%0A%20%20%20%20%20%20%20%20%7D%2C%200)%3B%0A%20%20%20%20%7D)%3B%0A%7D%0A%0Aasync%20function%20doNothing()%20%7B%0A%20%20%20%20return%3B%0A%7D%0A%0Aasync%20function%20test()%20%7B%0A%20%20%20%20var%20t%20%3D%20Date.now()%3B%0A%20%20%20%20for%20(var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B)%20%7B%0A%20%20%20%20%20%20%20%20for%20(var%20i%20%3D%200%3B%20i%20%3C%202000%3B%20i%2B%2B)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing()%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20await%20pause()%3B%0A%20%20%20%20%7D%0A%20%20%20%20return%20Date.now()%20-%20t%3B%0A%7D%0A%0Atest().then(alert)%3B%0A~options~%7B%22mode%22%3A%22promises%22%2C%22promiseType%22%3A%22Zousan%22%2C%22noRuntime%22%3Atrue%2C%22es6target%22%3Afalse%2C%22wrapAwait%22%3Afalse%2C%22spec%22%3Afalse%7D) 248ms
* [babel](https://babeljs.io/repl/#?babili=false&evaluate=true&lineWrap=false&presets=es2015%2Cstage-3&targets=&browsers=&builtIns=false&debug=false&experimental=true&loose=false&spec=false&code_lz=GYVwdgxgLglg9mABABwIYgM4FMAUBKRAbwChEzEAnLKECpMLAd0QAUK4BbGbHUSWBIhwASKjToAaRMKwV2FAiXLLE2KABUYHLHBBRe4aPCT4ipFRbG0ko6tZwAGPAG5zFgL5Snr5e5fF3YmJUDABPSEQ-I0EAEzgAOTgoAAsYMABzUyVyKzpXQOCwiKiBJCgsDH1FN0QAN1QKRChEAF5EABFUcoA6MDhGfB9yYDhGnHrGgCtWxAdnRGmAHkQAVjmFgGoN6osyEbGJxBgZ9ePlgCYHK_mYLZ3d5VRGVBhmuMSUtMz_B8CHp5ezTQmFwP3IfxydjoHS6WF6_VMAFomvkguVKvhuiksGAcKgADayKD-IA) 440ms - 1.8x slower
* [traceur](https://google.github.io/traceur-compiler/demo/repl.html#%2F%2F%20Options%3A%20--annotations%20--array-comprehension%20--async-functions%20--async-generators%20--exponentiation%20--export-from-extended%20--for-on%20--generator-comprehension%20--member-variables%20--proper-tail-calls%20--require%20--symbols%20--types%20%0Afunction%20pause()%20%7B%0A%20%20%20%20return%20new%20Promise(function%20(%24return%2C%20%24error)%20%7B%0A%20%20%20%20%20%20%20%20setTimeout(function%20()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return(0)%3B%0A%20%20%20%20%20%20%20%20%7D%2C%200)%3B%0A%20%20%20%20%7D)%3B%0A%7D%0A%0Aasync%20function%20doNothing()%20%7B%0A%20%20%20%20return%3B%0A%7D%0A%0Aasync%20function%20test()%20%7B%0A%20%20%20%20var%20t%20%3D%20Date.now()%3B%0A%20%20%20%20for%20(var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B)%20%7B%0A%20%20%20%20%20%20%20%20for%20(var%20i%20%3D%200%3B%20i%20%3C%202000%3B%20i%2B%2B)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing()%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20await%20pause()%3B%0A%20%20%20%20%7D%0A%20%20%20%20return%20Date.now()%20-%20t%3B%0A%7D%0A%0Atest().then(alert)%3B%0A) 1388ms - 5.6x slower

fast-async
==========

'fast-async' is a _Babel v6.x.x_ plugin that implements the ES7 keywords `async` and `await` using syntax transformation
at compile-time rather than generators.

The main reason for using 'fast-async' as opposed to Babel's default implementation of async/await is
performance (https://github.com/MatAtBread/nodent#performance) - it's 3-4 times faster in a browser/node, and
as much as 10 times faster on a mobile browsers, mainly due to avoiding generators (and therefore regenerator).

There's a simple test (that just makes sure the plugin works and generates code that runs). More complete
test coverage is included with nodent.

Because Babel parses the code, the ES7 extensions possible with nodent (`await` anywhere, `async return` and `async throw`) are not supported, however full implementation of `async function` containing `await` expressions is implemented.

For _Babel v5.x.x_ install fast-async@1.0.3

Install
-------

	npm install fast-async

Test
----
From the installation directory (e.g. node_modules/fast-async):

	npm test

Options
-------
The plugin accepts the following options object, which itself is optional, as are all members. These are based on the options in nodent,
but since much of the parsing is done by Babel some are unused.

	env:{
		log:function(string),        // Supplied routine to emit transformation warnings. Default: console.log
		augmentObject:false,         // Add the nodent utilities asyncify() and isThenable() to Object.prototype
		dontMapStackTraces:false,    // Don't install the stack trace hook that maps line numbers
		asyncStackTrace:false,       // Provide async stack traces
		dontInstallRequireHook:false // Don't transform all JS files as they are loaded into node
	},
	compiler:{
		promises:true,    // Use nodent's "Promises" mode. Set to false if your execution environment does not support Promises.
		generators:false  // Transform into 'Generators'.
	}

For more information on the compiler options, see [ES7 and Promises](https://github.com/matatbread/nodent#es7-and-promises) in the nodent documentation.

Useful Links
------------

* [nodent](https://github.com/MatAtBread/nodent)
* [Babel plugins](http://babeljs.io/docs/advanced/plugins/)

Online performance checkers:

* [nodent](http://nodent.mailed.me.uk/#function%20pause%28%29%20{%0A%20%20%20%20return%20new%20Promise%28function%20%28%24return%2C%20%24error%29%20{%0A%20%20%20%20%20%20%20%20setTimeout%28function%20%28%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return%280%29%3B%0A%20%20%20%20%20%20%20%20}%2C%200%29%3B%0A%20%20%20%20}%29%3B%0A}%0A%0Aasync%20function%20doNothing%28%29%20{%0A%20%20%20%20return%3B%0A}%0A%0Aasync%20function%20test%28%29%20{%0A%20%20%20%20var%20t%20%3D%20Date.now%28%29%3B%0A%20%20%20%20for%20%28var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20for%20%28var%20i%20%3D%200%3B%20i%20%3C%201000%3B%20i%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing%28%29%3B%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20await%20pause%28%29%3B%0A%20%20%20%20}%0A%20%20%20%20return%20Date.now%28%29%20-%20t%3B%0A}%0A%0Atest%28%29.then%28alert%29%3B%0A) 632ms (and shave off another 100ms by selecting 'Pure ES5' mode)
* [babel](https://babeljs.io/repl/#?experimental=true&evaluate=true&loose=false&spec=false&code=function%20pause%28%29%20{%0A%20%20%20%20return%20new%20Promise%28function%20%28%24return%2C%20%24error%29%20{%0A%20%20%20%20%20%20%20%20setTimeout%28function%20%28%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return%280%29%3B%0A%20%20%20%20%20%20%20%20}%2C%200%29%3B%0A%20%20%20%20}%29%3B%0A}%0A%0Aasync%20function%20doNothing%28%29%20{%0A%20%20%20%20return%3B%0A}%0A%0Aasync%20function%20test%28%29%20{%0A%20%20%20%20var%20t%20%3D%20Date.now%28%29%3B%0A%20%20%20%20for%20%28var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20for%20%28var%20i%20%3D%200%3B%20i%20%3C%201000%3B%20i%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing%28%29%3B%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20await%20pause%28%29%3B%0A%20%20%20%20}%0A%20%20%20%20return%20Date.now%28%29%20-%20t%3B%0A}%0A%0Atest%28%29.then%28alert%2Calert%29%3B%0A) 1877ms - 3x slower
* [traceur](https://google.github.io/traceur-compiler/demo/repl.html#%2F%2F%20Options%3A%20--annotations%20--array-comprehension%20--async-functions%20--async-generators%20--exponentiation%20--export-from-extended%20--for-on%20--generator-comprehension%20--member-variables%20--proper-tail-calls%20--require%20--symbols%20--types%20%0Afunction%20pause%28%29%20{%0A%20%20%20%20return%20new%20Promise%28function%20%28%24return%2C%20%24error%29%20{%0A%20%20%20%20%20%20%20%20setTimeout%28function%20%28%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%24return%280%29%3B%0A%20%20%20%20%20%20%20%20}%2C%200%29%3B%0A%20%20%20%20}%29%3B%0A}%0A%0Aasync%20function%20doNothing%28%29%20{%0A%20%20%20%20return%3B%0A}%0A%0Aasync%20function%20test%28%29%20{%0A%20%20%20%20var%20t%20%3D%20Date.now%28%29%3B%0A%20%20%20%20for%20%28var%20j%20%3D%200%3B%20j%20%3C%2050%3B%20j%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20for%20%28var%20i%20%3D%200%3B%20i%20%3C%201000%3B%20i%2B%2B%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20await%20doNothing%28%29%3B%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20%20%20%20%20await%20pause%28%29%3B%0A%20%20%20%20}%0A%20%20%20%20return%20Date.now%28%29%20-%20t%3B%0A}%0A%0Atest%28%29.then%28alert%2Calert%29%3B%20%0A) 2488ms - 4x slower

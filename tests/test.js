/* Test running for fast-async babel plugin
 *
 * Open the file ./test-input.js and compile it using the fast-async plugin and run it.
 *
 * It should output 'return: true'
 */

require('colors');
var fs = require('fs') ;

console.log("#### To run the tests you need to "+"npm install babel-core".yellow+". This additional module is only required for testing, not deployment.") ;

console.log("\nStarting tests...");

try {
	global.Promise = global.Promise || require('bluebird') ;
} catch (ex) {
	global.Promise = global.Promise || require('nodent').Thenable ;
}
var testCode = require('fs').readFileSync(__dirname+'/test-input.js').toString() ;

var babel = require("babel-core") ;

var transformers = {
	'fast-async':{plugins:[[require('../plugin.js'),{runtimePatten:'directive',env:{dontMapStackTraces:true},compiler:{promises:true}}]]},
};

var requires ;
try {
	requires = ['babel-plugin-transform-async-to-generator','babel-preset-es2015'] ;
	requires.map(require) ;
	transformers['transform-async-to-generator'] = {"presets": ["es2015"],plugins:['transform-async-to-generator']} ;
} catch (ex) {
	/* not installed */
	console.log("'"+("npm install "+requires.join(' ')).yellow+"' to compare against babel plugin 'transform-async-to-generator'") ;
}

try {
	requires = ['babel-plugin-transform-async-to-module-method','babel-preset-es2015','bluebird','coroutine'] ;
	requires.map(require) ;
	transformers['transform-async-to-module-method'] = {"presets": ["es2015"],plugins:[["transform-async-to-module-method",{module: 'bluebird',method: 'coroutine'}]]}
} catch (ex) {
	/* not installed */
	console.log("'"+("npm install "+requires.join(' ')).yellow+"' to compare against babel plugin 'transform-async-to-module-method'") ;
}

var keys = Object.keys(transformers) ;
(function nextTest(i){
	try {
		if (i===1) {
			try {
				function walkSync(dir,match) {
					if( dir[dir.length-1] != '/') dir=dir.concat('/')
					var fs = fs || require('fs'),
					files = fs.readdirSync(dir);
					files.forEach(function(file) {
						var stat = fs.lstatSync(dir + file) ;
						if (!stat.isSymbolicLink()) {
							if (file==match)
								throw dir + file ;
							if (stat.isDirectory())
								walkSync(dir + file + '/',match);
						}
					});
				};
				walkSync('node_modules','regenerator') ;
				console.log("Couldn't locate regenerator runtime") ;
			} catch (path) {
				console.log("Loading regenerator runtime") ;
				global.regeneratorRuntime = require("./"+path).default;
			}
		}
		console.log("Transforming with "+keys[i]);
		var t = babel.transform(testCode, transformers[keys[i]]);
		var f = new Function("require,resolve,reject",t.code) ;
		
		f(require,
		function(result){
			console.log(keys[i],result.green) ;
			next() ;
		},function(error){
			console.log(keys[i],(error.stack || error).red) ;
			next() ;
		}) ;
		function next() {
			i++ ;
			if (i<keys.length)
				nextTest(i) ;
		}
	} catch (ex) {
		console.error(ex.stack.red) ;
		next() ;
	}
})(0) ;

/* Test running for fast-async babel plugin
 *
 * Open the file ./test-input.js and compile it using the fast-async plugin and run it.
 *
 * It should output 'return: true'
 */

require('colors');
console.log("#### To run the tests you need to \"npm install babel-core\" and optionally (if you want to compare performance):");
console.log("####    "+"npm install babel-preset-es2015 babel-transform-async-to-module-method babel-transform-async-to-generator bluebird coroutine".yellow);
console.log("#### These additional modules are only required for testing, not deployment.")

console.log("#### "+"As of Nov-05 2015 the babel-transform-async* plugins appear to be broken".cyan)

console.log("\nStarting tests...");

try {
	global.Promise = global.Promise || require('bluebird') ;
} catch (ex) {
	global.Promise = global.Promise || require('nodent').Thenable ;
}
var testCode = require('fs').readFileSync(__dirname+'/test-input.js').toString() ;

var babel = require("babel-core") ;

var transformers = {
	'fast-async':{plugins:[[require('../plugin.js'),{env:{dontMapStackTraces:true},compiler:{promises:false}}]]},
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
			console.log("Loading babel-runtime/regenerator") ;
			global.regeneratorRuntime = require("babel-core/node_modules/babel-runtime/regenerator").default;
		}
		console.log("Transforming with "+keys[i]);
		var t = babel.transform(testCode, transformers[keys[i]]);
		var f = new Function("resolve,reject",t.code) ;
		f(function(result){
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

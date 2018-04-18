/* Test running for fast-async babel plugin
 *
 * Open the file ./test-input.js and compile it using the fast-async plugin and run it.
 *
 * It should output 'return: true'
 */

require('colors');
var fs = require('fs') ;

try {
    var babel = require("@babel/core") ;
} catch (ex) {
    console.log("#### To run the tests you need to "+"npm install @babel/core".yellow+" (run 'npm i' in this directory). This additional module is only required for testing, not deployment.") ;
    process.exit(-1) ;
}

try {
    global.gc() ;
} catch (ex) {
    console.log("You get more accurate timings by running with the node option --expose-gc") ;
    global.gc = function(){} ;
}

console.log("\nNB:The timings here are only indicative. GC and poor sampling generate variable results. More detailed performance tests can be found in "+"nodent".cyan+"\nStarting tests...");

var nodent = require('nodent') ;
var systemPromise = global.Promise || nodent.EagerThenable() ;

global.Promise = nodent.EagerThenable() ;

var testCode = require('fs').readFileSync(__dirname+'/test-input.js').toString() ;

var eagerName = 'fast-async (nodent-'+nodent.EagerThenable().name+')' ; 
var transformers = {
    'fast-async (es7-lazy)':  {plugins:[[require('../plugin.js'),{runtimePatten:'directive',compiler:{promises:false,es7:true,lazyThenables:true}}]]},
    'fast-async (spec:true)':  {plugins:[[require('../plugin.js'),{runtimePatten:null,compiler:{promises:true,es7:true,noRuntime:true,wrapAwait:true}}]]},
};
transformers[eagerName] = {plugins:[[require('../plugin.js'),{runtimePatten:'directive',compiler:{promises:false,es7:true,lazyThenables:false}}]]} ;


var needRegenerator = Object.keys(transformers).length ;

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

function loadRegenerator(){
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
    global.regeneratorRuntime = require("./"+path);
    console.log("Loaded regenerator runtime from "+path+" ",regeneratorRuntime.toString().yellow) ;
    global.Promise = systemPromise ;
  }
}

var keys = Object.keys(transformers) ;
(function nextTest(i){
	try {
		if (i===needRegenerator)
            loadRegenerator() ;

		console.log("Transforming with "+keys[i]);
		var t = babel.transform(testCode, transformers[keys[i]]);
		var f = new Function("require,resolve,reject",t.code) ;

        global.gc() ;
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

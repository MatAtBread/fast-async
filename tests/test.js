/* Test running for fast-async babel plugin 
 * 
 * Open the file ./test-input.js and compile it using the fast-async plugin and run it.
 * 
 * It should output 'return: true'
 */
var t = require("babel-core").transform(require('fs').readFileSync(__dirname+'/test-input.js'), {
  plugins: [require("../plugin.js")]
});
var f = new Function(t.code) ;
f() ;

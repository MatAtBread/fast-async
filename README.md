fast-async
==========

'fast-async' plugin for Babel. It uses nodent to transform the entire program before passing it off
to the next transformer.

The main reason for using 'fast-async' as opposed to Babel's default implementation of async/await is 
performance (https://github.com/MatAtBread/nodent#performance) - it's 3-4 times faster in a browser, and
as much as 10 times faster on a mobile, mainly due to regenerator, which is pretty slow at pretending to
be generators.

There's a simple test (that just makes sure the plugin works and generates code that runs). More complete
test coverage is included with nodent.
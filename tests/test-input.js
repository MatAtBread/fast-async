/* fast-async test file - it gets compiled by Babel using fast-async and other async-await implementations to measure performance */

function pause() {
    return new Promise(function ($return, $error) {
        setTimeout(function () {
            return $return(0);
        }, 0);
    });
}

async function doNothing() {
    return;
}

async function test() {
    var t = Date.now();
    for (var j = 0; j < 500; j++) {
        for (var i = 0; i < 500; i++) {
            await doNothing();
        }
        await pause();
    }
    return "Finished "+(500*500)+" async/awaits in "+(Date.now() - t)+"ms";
}

test().then(resolve,reject) ;

/* If you see this, then test-input.js was compiled by babel-cli. Things to check are that there's an import at the top for nodent-runtime, and lots of symbols starting with $ */

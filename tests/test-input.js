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
    return "Finished in "+(Date.now() - t)+"ms";
}

test().then(done,done) ;

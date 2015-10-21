async function add(a,b) {
	async function log(x) {
		return x ;
	}
	await log(a+b) ;
	return a+b ;
}  

async function test() {
	return await add(123,await add(234,345))==702 ;
}

test().then(console.log.bind(console,"return:"),console.log.bind(console,"error:")) ;

const https = require('https');

const options = {
	method: 'GET',
	hostname: 'sportapi7.p.rapidapi.com',
	port: null,
	path: '/api/v1/player/333341/image',
	headers: {
		'x-rapidapi-key': 'd1d05dfa98mshe5ad7c03dda4a0cp102fc3jsnef448e1e6534',
		'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
	}
};

const req = https.request(options, function (res) {
	console.log(res.statusCode);
	res.resume();
});
req.end();

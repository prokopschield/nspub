const nspub = require('..');

module.exports = () =>
	new Promise((resolve) => {
		nspub.ready(() => {
			nspub.dir('tests').then(console.log).then(resolve);
		});
	});

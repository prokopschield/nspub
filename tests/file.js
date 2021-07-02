const nspub = require('..');

module.exports = () =>
	new Promise((resolve) => {
		nspub.ready(() => {
			nspub.file('tests/file.js').then(console.log).then(resolve);
		});
	});

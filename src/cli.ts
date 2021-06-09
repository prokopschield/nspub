#!/usr/bin/env node

import ask from 'nslibmgr/lib/ask'
import clipboardy from 'clipboardy';
import fs from 'fs'
import nspub from './nspub'

(async () => {
	let cont = false;
	do {
		await new Promise (async resolve => {
			let dir = '.'

			do {
				dir = (await ask('Drag-and-drop directory!')) || await clipboardy.read()
			} while (!dir || !fs.existsSync(dir))

			nspub.ready(() => nspub.dir(dir).then((hash) => {
				const link = `https://nspub.nodesite.eu/static/${hash}.html`;
				console.log(link);
				clipboardy.write(link).then(resolve)
			}))
		});
		cont = (await ask('Continue? (yes/no)'))?.toLocaleLowerCase()[0] === 'y';
	} while (cont);
	process.exit();
})();

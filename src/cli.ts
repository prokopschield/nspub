#!/usr/bin/env node

import ask from 'nslibmgr/lib/ask'
import clipboardy from 'clipboardy';
import fs from 'fs'
import nspub from './nspub'
import path from 'path';

(async () => {
	let cont = false;
	do {
		try {
			await new Promise (async resolve => {
				let dir = '';

				do {
					dir = process.argv.pop() || (await ask('Drag-and-drop directory!')) || await clipboardy.read()
					if (!fs.existsSync(dir)) {
						try {
							dir = eval(dir);
						} catch(error) {}
					}
				} while (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
				
				dir = path.resolve(dir);

				nspub.ready(() => nspub.dir(dir).then((hash) => {
					console.log(`Finished: ${dir}`);
					const link = `https://nspub.nodesite.eu/static/${hash}.html`;
					console.log(link);
					clipboardy.write(link).then(() => console.log('Copied to clipboard!')).then(resolve);
				}))
			});
			cont = (await ask('Upload another? (yes/no)'))?.toLocaleLowerCase()[0] === 'y';
		} catch (error) {
			cont = false;
		}
	} while (cont);
	process.exit();
})();

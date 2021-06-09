const { blake2sHex } = require('blakejs');
import fs from 'fs';
import { direct, NodeSiteClient, rawwrite } from 'nodesite.eu';
import path from 'path';

const ready = NodeSiteClient.init();

export class nspub {
	public static ready (callback: () => void) {
		ready.then(callback);
	}
	public static hashmap = new Map<string, string>();
	public static async blob (data: Buffer | string): Promise<string> {
		const blake = blake2sHex(data);
		const prehash = nspub.hashmap.get(blake);
		if (prehash) return prehash;
		return new Promise (resolve => {
			rawwrite('blake2hash', blake);
			direct()?.once(blake, (hash?: string) => {
				if (hash) {
					return resolve(hash);
				} else {
					rawwrite('blob2hash', blake, data);
					direct()?.once(blake, (hash: string) => resolve(hash));
				}
			});
		});
	}
	public static async file (file: string): Promise<string> {
		const data = await fs.promises.readFile(file);
		return await nspub.blob(data);
	}
	public static async dir (dir: string): Promise<string> {
		const read = await fs.promises.readdir(dir);
		const hashed = await Promise.all(read.map(async fname => {
			const pname = path.resolve(dir, fname);
			const stat = await fs.promises.stat(pname);
			if (stat.isDirectory()) {
				return `${await nspub.dir(pname)}.html`
			} else if (stat.isFile()) {
				return `${await nspub.file(pname)}/${fname}`
			} else return null;
		}));
		let ret = `<h1>${path.basename(dir)}</h1><ul>`;
		for (let i=0; i < hashed.length; ++i) {
			i && (ret += `<li><a href="/static/${hashed[i]}">${read[i]}</a></li>`);
		}
		ret += '</ul>';
		return nspub.blob(ret);
	}
}

export default nspub;
module.exports = nspub;

Object.assign(nspub, {
	default: nspub,
	nspub,
});

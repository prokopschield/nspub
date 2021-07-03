import { blake2sHex } from 'blakets';
import { getConfig } from 'doge-config';
import fs from 'fs';
import { direct, NodeSiteClient, rawwrite } from 'nodesite.eu';
import path from 'path';

const config = getConfig('nspub', {
	size_limit: 1 << 24,
});

const { size_limit } = config.num;

const ready = NodeSiteClient.ready;

export class nspub {
	public static ready(callback: () => void) {
		ready.then(callback);
	}
	public static hashmap = new Map<string, string>();
	public static async blob(
		data: Buffer | string,
		file?: string
	): Promise<string> {
		if (data.length > size_limit) {
			console.log(`${file} was too large.`);
			throw new Error('File too large.');
		}
		const blake = blake2sHex(data);
		const prehash = nspub.hashmap.get(blake);
		if (prehash) return prehash;
		return new Promise(async (resolve) => {
			const socket = await ready;
			socket.emit('blake2hash', blake).once(blake, (hash?: string) => {
				if (hash) {
					nspub.hashmap.set(blake, hash);
					return resolve(hash);
				} else {
					rawwrite('blob2hash', blake, data);
					function resolver(hash?: string) {
						if (hash) {
							resolve(hash);
							nspub.hashmap.set(blake, hash);
						} else {
							socket.once(blake, resolver);
						}
					}
					resolver();
				}
			});
		});
	}
	public static async file(file: string, dir?: string): Promise<string> {
		const data = await fs.promises.readFile(file);
		return await nspub.blob(data, dir && path.relative(dir, file));
	}
	public static async dir(dir: string): Promise<string> {
		const read = await fs.promises.readdir(dir);
		const hashed = await Promise.all(
			read.map(async (fname) => {
				try {
					const pname = path.resolve(dir, fname);
					const stat = await fs.promises.stat(pname);
					if (stat.isDirectory()) {
						return `${await nspub.dir(pname)}.html`;
					} else if (stat.isFile()) {
						return `${await nspub.file(pname, dir)}/${fname}`;
					} else return null;
				} catch (error) {
					return null;
				}
			})
		);
		let ret = `<h1>${path.basename(dir)}</h1><ul>`;
		for (let i = 0; i < hashed.length; ++i) {
			hashed[i] &&
				(ret += `<li><a href="/static/${hashed[i]}">${read[i]}</a></li>`);
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

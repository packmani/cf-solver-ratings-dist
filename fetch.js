import { gzipSync } from 'node:zlib';
import { writeFileSync, existsSync, renameSync, mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises'
import { dirname } from 'node:path'
async function apiGet(url) {
    try {
        const res = await fetch(url);
        if(!res.ok) {
            throw new Error(`HTTP: ${res.status} for URL: ${url}`);
        }
        const text = await res.text();
        const parsed = JSON.parse(text);
        if(parsed.status!=="OK") {
            throw new Error(`API refused URL: ${url} \nstatus: ${parsed.status} \ncomment: ${parsed.comment}`);
        }
        return text;
    } finally {
        await sleep(2000);
    }
    
}

async function fetchToFile(url, path) { //false if path already exists
    if(existsSync(path)) return false;
    const text = await apiGet(url);
    mkdirSync(dirname(path), {recursive: true});
    writeFileSync(path+".tmp", gzipSync(text));
    renameSync(path+".tmp", path);
    return true;
}

async function main() {
    await fetchToFile("https://codeforces.com/api/contest.list", "data/contest.list.gz");

}

try {
    await main();
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
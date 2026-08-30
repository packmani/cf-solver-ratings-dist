import { gzipSync, gunzipSync } from 'node:zlib';
import { writeFileSync, existsSync, renameSync, mkdirSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises'
import { dirname } from 'node:path'

const API = "https://codeforces.com/api";

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

function buildTargets() {
    const raw = JSON.parse(gunzipSync(readFileSync("data/contest.list.gz")));
    const targets = raw.result
        .filter(c => c.phase === "FINISHED")
        .toSorted((a, b) => a.startTimeSeconds - b.startTimeSeconds)
        .map(({ id, name, startTimeSeconds, type }) => ({ id, name, startTimeSeconds, type }));
    writeFileSync("data/targets.json", JSON.stringify(targets, null, 2));
    return targets;
}

async function main() {
    await fetchToFile(`${API}/contest.list`, "data/contest.list.gz");
    const targets = buildTargets();
    console.log(`${targets.length} finished contests`);

    for (const [i, c] of targets.entries()) {
        const jobs = [
            [`${API}/contest.standings?contestId=${c.id}`, `data/standings/${c.id}.json.gz`],
            [`${API}/contest.ratingChanges?contestId=${c.id}`, `data/rating/${c.id}.json.gz`],
        ];
        for (const [url, path] of jobs) {
            const fetched = await fetchToFile(url, path);
            if (fetched) {
                console.log(`[${i + 1}/${targets.length}] ${path} ${readFileSync(path).length} bytes`);
            }
        }
    }
    console.log("done");
}

try {
    await main();
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
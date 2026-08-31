import { gzipSync, gunzipSync } from 'node:zlib';
import { writeFileSync, existsSync, renameSync, mkdirSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises'
import { dirname } from 'node:path'

const API = "https://codeforces.com/api";

class ApiError extends Error {
    constructor(url, httpStatus, comment) {
        super(`API refused URL: ${url} \nHTTP: ${httpStatus} \ncomment: ${comment}`);
        this.comment = comment ?? "";
    }
}

async function apiGet(url) {
    try {
        const res = await fetch(url);
        const text = await res.text();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            throw new Error(`Non-JSON response, HTTP ${res.status}, for URL: ${url}\n${text.slice(0, 300)}`);
        }

        if(!res.ok || parsed.status!=="OK") {
            throw new ApiError(url, res.status, parsed.comment);
        }
        return text;
    } finally {
        await sleep(500);
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

const SKIPPABLE = ["Rating changes are unavailable", "not found"];
//unrated and private/hidden contests?

async function fetchOrSkip(url, path) { //unrated contest writes an empty result
    try {
        return await fetchToFile(url, path);
    } catch (err) {
        //console.log(`HELLO ${SKIPPABLE.some(s => err.comment.includes(s))}`);
        if (!(err instanceof ApiError) || !SKIPPABLE.some(s => err.comment.includes(s))) throw err;
        mkdirSync(dirname(path), {recursive: true});
        writeFileSync(path+".tmp", gzipSync(JSON.stringify({status: "SKIPPED", comment: err.comment})));
        renameSync(path+".tmp", path);
        console.log(`skipped: ${path} — ${err.comment}`);
        return true;
    }
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
        const standings = await fetchOrSkip(`${API}/contest.standings?contestId=${c.id}`, `data/standings/${c.id}.json.gz`);
        if (standings) {
            console.log(`[${i + 1}/${targets.length}] data/standings/${c.id}.json.gz ${readFileSync(`data/standings/${c.id}.json.gz`).length} bytes`);
        }
        const rating = await fetchOrSkip(`${API}/contest.ratingChanges?contestId=${c.id}`, `data/rating/${c.id}.json.gz`);
        if (rating) {
            console.log(`[${i + 1}/${targets.length}] data/rating/${c.id}.json.gz ${readFileSync(`data/rating/${c.id}.json.gz`).length} bytes`);
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
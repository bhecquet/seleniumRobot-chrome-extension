const http = require('http');
const fs = require('fs');
const path = require('path');

let events = [];
let eventServer;
let pageServer;

function startServers() {
    events = [];

    eventServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }

        if (req.method === 'POST' && req.url === '/event') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                console.log('[Test server] Event received:', body);
                events.push(JSON.parse(body));
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('OK');
            });
            return;
        }

        res.writeHead(404);
        res.end();
    });

    pageServer = http.createServer((req, res) => {
        const fixturesDir = path.resolve(__dirname, '..', 'fixtures');
        const requestedUrl = new URL(req.url, 'http://127.0.0.1:8000');
        const requestedFile = requestedUrl.pathname === '/' ? 'recorder-test-page.html' : requestedUrl.pathname.substring(1);
        const filePath = path.resolve(fixturesDir, requestedFile);

        if (!filePath.startsWith(fixturesDir + path.sep)) {
            res.writeHead(403, {'Content-Type': 'text/plain'});
            return res.end('Forbidden');
        }

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            return res.end(`Missing test file: ${requestedFile}`);
        }

        const extension = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };

        res.writeHead(200, {'Content-Type': contentTypes[extension] || 'application/octet-stream'});
        res.end(fs.readFileSync(filePath));
    });
    return Promise.all([
        new Promise(resolve => eventServer.listen(5222, resolve)),
        new Promise(resolve => pageServer.listen(8000, '127.0.0.1', resolve))
    ]);
}

function stopServers() {
    return Promise.all([
        new Promise(resolve => eventServer.close(resolve)),
        new Promise(resolve => pageServer.close(resolve))
    ]);
}

function clearEvents() {
    events = [];
}

function getEvents() {
    return [...events];
}

async function waitForEvent(command, timeout = 5000) {
    const end = Date.now() + timeout;

    while (Date.now() < end) {
        const event = events.find(item => item.command === command);
        if (event) return event;
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(`No "${command}" event received within ${timeout} ms`);
}

async function waitForTarget(type, value, timeout = 5000) {
    const end = Date.now() + timeout;

    while (Date.now() < end) {
        const event = events.find(item =>
            item.command === 'click'
            && Array.isArray(item.targets)
            && item.targets.some(target => target[0] === type && target[1] === value)
        );

        if (event) return event;
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(`No click event received with target "${type}=${value}" within ${timeout} ms`);
}

module.exports = {startServers, stopServers, clearEvents, getEvents, waitForEvent, waitForTarget};